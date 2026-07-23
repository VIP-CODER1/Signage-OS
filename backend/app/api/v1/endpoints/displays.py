from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status, UploadFile, File
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_admin
from app.models.admin import Admin
from app.models.display import Display
from app.schemas.display import (
    DisplayCreate, DisplayUpdate,
    DisplayResponse, DisplayListResponse,
)
from app.schemas.excel import CommitRequest, CommitResponse
from app.services.display_service import (
    create_display, get_displays_paginated,
    get_display_by_id, update_display, delete_display,
)
from app.services.display_formatter import format_display_response
from app.services.excel_template import generate_template, generate_failed_rows_excel
from app.services.excel_parser import validate_excel, commit_validated_rows, ExcelParseError
from app.core.exceptions import DuplicateDisplayIdError

router = APIRouter(
    prefix="/api/displays",
    tags=["Displays"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=DisplayListResponse)
async def list_displays(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search name, IP, or location"),
    status: Optional[str] = Query(None, pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$"),
    _admin: Admin = Depends(get_current_admin),
):
    items, pagination = await get_displays_paginated(page, limit, search, status)

    return DisplayListResponse(
        data=[await format_display_response(d) for d in items],
        pagination=pagination,
    )


@router.post("", response_model=DisplayResponse, status_code=status.HTTP_201_CREATED)
async def create_single_display(
    data: DisplayCreate,
    _admin: Admin = Depends(get_current_admin),
):
    try:
        display = await create_display(data)
    except DuplicateDisplayIdError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display ID already exists",
        )
    return await format_display_response(display)


@router.get("/bulk-upload/template")
async def download_template(
    _admin: Admin = Depends(get_current_admin),
):
    buffer = generate_template()
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=display_template.xlsx"},
    )


@router.post("/bulk-upload/validate")
async def validate_excel_upload(
    file: UploadFile = File(...),
    _admin: Admin = Depends(get_current_admin),
):
    try:
        content = await file.read()
        result = await validate_excel(content, file.filename or "unknown.xlsx")
        return result
    except ExcelParseError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/bulk-upload/commit", response_model=CommitResponse)
async def commit_bulk_upload(
    request: CommitRequest,
    _admin: Admin = Depends(get_current_admin),
):
    try:
        result = await commit_validated_rows(request.rows)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/bulk-upload/failed-rows")
async def download_failed_rows(
    request: CommitRequest,
    _admin: Admin = Depends(get_current_admin),
):
    buffer = generate_failed_rows_excel(request.rows)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=failed_rows.xlsx"},
    )


@router.get("/{id}", response_model=DisplayResponse)
async def get_display(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")
    return await format_display_response(display)


@router.put("/{id}", response_model=DisplayResponse)
async def update_single_display(
    id: str,
    data: DisplayUpdate,
    _admin: Admin = Depends(get_current_admin),
):
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")

    if data.display_id and data.display_id != display.display_id:
        existing = await Display.find_one(Display.display_id == data.display_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display ID already exists",
            )

    display = await update_display(display, data)
    return await format_display_response(display)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_display(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")
    await delete_display(display)
