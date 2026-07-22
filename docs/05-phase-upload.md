# Phase 4: Bulk Upload System

> **Effort:** 10–12 hours (max) | **Depends on:** Phase 0, 1, 2, 3 | **Agent:** security-auditor (file upload audit)

---

## Objective

Three endpoints: download Excel template, validate uploaded Excel, commit validated data. Row-by-row validation engine with inline error reporting. This is the most complex backend feature.

> **Spec reference:** §4.3, §6

---

## 4.1 Excel Template Generator — `backend/app/services/excel_template.py`

```python
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

# Header styling
HEADER_FONT = Font(name="Calibri", bold=True, size=11, color="FFFFFF")
HEADER_FILL = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
HEADER_ALIGNMENT = Alignment(horizontal="center", vertical="center")

# Required column fill
REQUIRED_FILL = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")

# Column spec from spec §6.1
COLUMNS = [
    {"name": "display_id",    "required": True,  "width": 18, "description": "Unique ID (e.g. DSP-001)"},
    {"name": "name",          "required": True,  "width": 35, "description": "Descriptive display name"},
    {"name": "ip_address",    "required": True,  "width": 20, "description": "IPv4 or IPv6 address"},
    {"name": "location",      "required": True,  "width": 30, "description": "Physical location"},
    {"name": "status",        "required": False, "width": 16, "description": "ACTIVE, INACTIVE, or MAINTENANCE"},
    {"name": "content_profiles", "required": False, "width": 30, "description": "Comma-separated profile names"},
]

def generate_template() -> BytesIO:
    """Generate the Excel template with column headers, validation, and example row.

    Returns a BytesIO buffer of the .xlsx file. Spec §6.1.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Displays"

    # ── Header Row ──
    for col_idx, col in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col["name"])
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL if not col["required"] else REQUIRED_FILL
        cell.alignment = HEADER_ALIGNMENT
        ws.column_dimensions[get_column_letter(col_idx)].width = col["width"]

    # ── Data Validation for Status ──
    status_col = get_column_letter(5)  # Column E = status
    status_dv = DataValidation(
        type="list",
        formula1='"ACTIVE,INACTIVE,MAINTENANCE"',
        allow_blank=True,
    )
    status_dv.error = "Status must be ACTIVE, INACTIVE, or MAINTENANCE"
    status_dv.errorTitle = "Invalid Status"
    ws.add_data_validation(status_dv)
    status_dv.add(f"{status_col}2:{status_col}1048576")  # entire column below header

    # ── Example Row ──
    example_data = ["DSP-001", "Main Entrance", "192.168.1.50", "HQ, Floor 1", "ACTIVE", "Wayfinding Static,Event Schedule"]
    for col_idx, value in enumerate(example_data, start=1):
        ws.cell(row=2, column=col_idx, value=value)

    # ── Legend Sheet ──
    ws2 = wb.create_sheet("Instructions")
    ws2.column_dimensions["A"].width = 25
    ws2.column_dimensions["B"].width = 55
    legend = [
        ("Field", "Rules"),
        ("display_id", "Required. 3-30 chars, alphanumeric. Must be unique. Example: DSP-001"),
        ("name", "Required. 2-100 characters. Descriptive display name."),
        ("ip_address", "Required. Valid IPv4 or IPv6 address."),
        ("location", "Required. 2-150 characters."),
        ("status", "Optional. Defaults to ACTIVE. Must be: ACTIVE, INACTIVE, or MAINTENANCE."),
        ("content_profiles", "Optional. Comma-separated list. Unknown profiles are auto-created."),
    ]
    for row_idx, (field, rules) in enumerate(legend, start=1):
        ws2.cell(row=row_idx, column=1, value=field).font = Font(bold=True, size=11)
        ws2.cell(row=row_idx, column=2, value=rules)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
```

---

## 4.2 Validation Engine — `backend/app/services/excel_parser.py`

### IP Address Validator

```python
import re
import ipaddress
from typing import List, Dict, Any, Set, Optional, Tuple

# IPv4 + IPv6 regex patterns
IPV4_PATTERN = re.compile(
    r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$"
)
IPV6_PATTERN = re.compile(
    r"^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|"
    r"(?:[0-9a-fA-F]{1,4}:){1,7}:|"
    r"(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|"
    r"(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|"
    r"(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|"
    r"(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|"
    r"(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|"
    r"[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|"
    r":(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|"
    r"fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|"
    r"::(?:ffff(?::0{1,4}){0,1}:){0,1}"
    r"(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}"
    r"(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|"
    r"[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,4}))$"
)

VALID_STATUSES = {"ACTIVE", "INACTIVE", "MAINTENANCE"}
```

### Row Validation Errors Schema — `backend/app/schemas/excel.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ValidationErrorItem(BaseModel):
    field: str
    message: str

class ValidatedRow(BaseModel):
    row_number: int
    is_valid: bool
    data: Optional[dict] = None
    errors: List[ValidationErrorItem] = []

class ValidationSummary(BaseModel):
    total_rows: int
    valid_rows: int
    failed_rows: int

class ValidationResponse(BaseModel):
    is_valid: bool
    summary: ValidationSummary
    preview: List[ValidatedRow]
```

### Parser with Full Validation (spec §6.2)

```python
from io import BytesIO
from openpyxl import load_workbook
from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.schemas.excel import ValidationErrorItem, ValidatedRow, ValidationResponse, ValidationSummary

REQUIRED_COLUMNS = ["display_id", "name", "ip_address", "location"]
FILE_MAX_SIZE = 10 * 1024 * 1024  # 10 MB

class ExcelParseError(Exception):
    def __init__(self, detail: str, status_code: int = 422):
        self.detail = detail
        self.status_code = status_code

async def validate_excel(file_content: bytes, filename: str) -> dict:
    """
    Full validation pipeline (spec §6.2):
    1. File constraint check (extension + size)
    2. Structural validation (required sheets + columns)
    3. Row-by-row evaluation with intra-sheet + DB cross-reference
    """

    # ── Step 1: File Constraint ──
    if not filename.endswith(".xlsx"):
        raise ExcelParseError("File must be a .xlsx Excel file", 422)

    if len(file_content) > MAX_FILE_SIZE:
        raise ExcelParseError("File exceeds 10MB maximum size", 422)

    # ── Step 2: Structural Validation ──
    try:
        wb = load_workbook(BytesIO(file_content), read_only=True)
    except Exception:
        raise ExcelParseError("File is not a valid Excel workbook", 422)

    if "Displays" not in wb.sheetnames:
        raise ExcelParseError("Missing required sheet 'Displays'", 422)

    ws = wb["Displays"]

    # Read header row
    header_row = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
    if header_row is None:
        raise ExcelParseError("Empty workbook — no header row found", 422)

    # Check required columns
    missing = [
        col for col in REQUIRED_COLUMNS
        if col not in header_row
    ]
    if missing:
        raise ExcelParseError(f"Missing column(s): {', '.join(missing)}", 422)

    column_indices = {name: idx for idx, name in enumerate(header_row)}

    # ── Step 3: Collect existing display_ids from DB ──
    existing_ids = {
        d.display_id async for d in Display.find_all().project(Display.display_id)
    }
    seen_ids: Set[str] = set()

    # ── Step 4: Row-by-Row Evaluation ──
    preview = []
    valid_count = 0
    row_number = 1  # row 1 = header

    for row in ws.iter_rows(min_row=2):  # skip header
        row_number += 1
        row_values = [cell.value for cell in row]

        # Skip completely empty rows
        if all(v is None or str(v).strip() == "" for v in row_values):
            continue

        data = {}
        errors = []

        for col_name, col_idx in column_indices.items():
            value = row_values[col_idx] if col_idx < len(row_values) else None
            data[col_name] = str(value).strip() if value else ""  # col_name is the field name

        # Validate display_id
        display_id = data.get("display_id", "")
        if not display_id:
            errors.append(ValidationErrorItem(field="display_id", message="Required field is empty"))
        elif len(display_id) < 3 or len(display_id) > 30:
            errors.append(ValidationErrorItem(field="display_id", message="Must be 3-30 characters"))
        elif not display_id.replace("-","").replace("_","").isalnum():
            errors.append(ValidationErrorItem(field="display_id", message="Must be alphanumeric (hyphens/underscores allowed)"))
        elif display_id in seen_ids:
            errors.append(ValidationErrorItem(field="display_id", message="Duplicate display_id encountered in same sheet"))
        elif display_id in existing_ids:
            errors.append(ValidationErrorItem(field="display_id", message="Display ID already exists in database"))

        if display_id:
            seen_ids.add(display_id)

        # Validate name
        name_val = data.get("name", "")
        if not name_val:
            errors.append(ValidationErrorItem(field="name", message="Required field is empty"))
        elif len(name_val) < 2 or len(name_val) > 100:
            errors.append(ValidationErrorItem(field="name", message="Must be 2-100 characters"))

        # Validate ip_address
        ip_val = data.get("ip_address", "")
        if not ip_val:
            errors.append(ValidationErrorItem(field="ip_address", message="Required field is empty"))
        elif not (IPV4_PATTERN.match(ip_val) or IPV6_PATTERN.match(ip_val)):
            errors.append(ValidationErrorItem(field="ip_address", message="Invalid IP address format"))

        # Validate location
        loc_val = data.get("location", "")
        if not loc_val:
            errors.append(ValidationErrorItem(field="location", message="Required field is empty"))
        elif len(loc_val) < 2 or len(loc_val) > 150:
            errors.append(ValidationErrorItem(field="location", message="Must be 2-150 characters"))

        # Validate status
        status_val = data.get("status", "ACTIVE")
        if not status_val:
            data["status"] = "ACTIVE"  # default
        elif status_val not in VALID_STATUSES:
            errors.append(ValidationErrorItem(field="status", message="Value must be ACTIVE, INACTIVE, or MAINTENANCE"))

        # Validate content_profiles
        cp_val = data.get("content_profiles", "")
        cp_list = []
        if cp_val:
            cp_list = [p.strip() for p in cp_val.split(",") if p.strip()]
            for profile_name in cp_list:
                exists = await ContentProfile.find_one(ContentProfile.name == profile_name)
                if not exists:
                    errors.append(ValidationErrorItem(
                        field="content_profiles",
                        message=f"Content profile '{profile_name}' will be auto-created but has warning flag",
                    ))
        data["content_profiles"] = cp_list

        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1

        preview.append(ValidatedRow(
            row_number=row_number,
            is_valid=is_valid,
            data=data,
            errors=errors,
        ))

    total_rows = len(preview)
    return ValidationResponse(
        is_valid=(valid_count == total_rows),
        summary=ValidationSummary(
            total_rows=total_rows,
            valid_rows=valid_count,
            failed_rows=total_rows - valid_count,
        ),
        preview=preview,
    )
```

---

## 4.3 Bulk Upload Endpoints — `backend/app/api/v1/endpoints/displays.py`

Add these routes to the displays router:

```python
from fastapi import UploadFile, File

@router.get("/bulk-upload/template")
async def download_template():
    """Download empty Excel template. Spec §4.3 — GET .../template."""
    buffer = generate_template()
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=display_template.xlsx"}
    )

@router.post("/bulk-upload/validate")
async def validate_excel_upload(
    file: UploadFile = File(...),
    _admin: Admin = Depends(get_current_admin),
):
    """Parse Excel and return preview with errors. Spec §4.3 — POST .../validate."""
    try:
        content = await file.read()
        result = await validate_excel_file(content, file.filename or "unknown.xlsx")
        return result
    except ExcelParseError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/bulk-upload/commit")
async def commit_bulk_upload(
    request: CommitRequest,
    _admin: Admin = Depends(get_current_admin),
):
    """Commit validated preview data. Spec §4.3 — POST .../commit."""
    # ... (see section 4.4 below)
```

---

## 4.5 Bulk Commit — `backend/app/services/excel_parser.py`

### Optimization: Batch-resolve profiles before insert (avoids N+1)

```python
from typing import Dict, Set
from app.models.content_profile import ContentProfile
from app.schemas.display import DisplayCreate

async def bulk_resolve_content_profiles(all_names: Set[str]) -> Dict[str, ContentProfile]:
    """Batch-resolve all profile names in a single query. Avoids N+1."""
    existing = await ContentProfile.find_many(
        ContentProfile.name.in_(list(all_names))
    ).to_list()
    result = {p.name: p for p in existing}
    # Auto-create any missing profiles
    for name in all_names:
        if name and name not in result:
            profile = ContentProfile(name=name, priority="MEDIUM")
            await profile.insert()
            result[name] = profile
    return result

async def commit_validated_rows(validated_data: List[dict]) -> dict:
    """Commit validated rows to MongoDB using insert_many() batch operation. Spec §8.1."""
    # Phase 1: Collect all unique profile names across all rows
    all_profile_names: Set[str] = set()
    for row_data in validated_data:
        profiles = row_data.get("content_profiles", [])
        if isinstance(profiles, list):
            all_profile_names.update(profiles)
        elif isinstance(profiles, str):
            all_profile_names.update(p.strip() for p in profiles.split(",") if p.strip())

    # Phase 2: Resolve all profiles in one batch query
    profiles_cache = await bulk_resolve_content_profiles(all_profile_names)

    # Phase 3: Build Display documents and bulk insert
    displays_to_insert = []
    commit_errors = []

    for idx, row_data in enumerate(validated_data):
        try:
            create_data = DisplayCreate(**row_data)
            profile_names = create_data.content_profiles
            resolved = [profiles_cache[name] for name in profile_names if name in profiles_cache]

            display = Display(
                display_id=create_data.display_id,
                name=create_data.name,
                ip_address=create_data.ip_address,
                location=create_data.location,
                status=create_data.status,
                content_profiles=resolved,
            )
            displays_to_insert.append(display)
        except Exception as e:
            commit_errors.append({
                "row": idx + 1,
                "error": str(e),
            })

    if displays_to_insert:
        await Display.insert_many(displays_to_insert)

    return {
        "inserted": len(displays_to_insert),
        "failed": len(commit_errors),
        "total": len(validated_data),
        "errors": commit_errors,
    }
```

---

## 4.6 Excel Sheet Schema (from spec §6.1)

```
| Column           | Req'd | Type   | Validation                          |
|------------------|-------|--------|-------------------------------------|
| display_id       | YES   | String | 3-30 chars, alphanumeric, unique    |
| name             | YES   | String | 2-100 chars                         |
| ip_address       | YES   | String | IPv4 or IPv6 regex                  |
| location         | YES   | String | 2-150 chars                         |
| status           | NO    | String | ACTIVE / INACTIVE / MAINTENANCE     |
| content_profiles | NO    | String | Comma-separated profile names       |
```

---

## 4.7 Upload Flow (from spec §1.2, Figure 3)

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client  │         │  FastAPI     │         │ MongoDB  │
└──────────┘         └──────────────┘         └──────────┘
     │  GET /template     │                        │
     │ ─────────────────► │                        │
     │ ◄─── .xlsx ──────  │                        │
     │                    │                        │
     │  POST /validate    │                        │
     │  (multipart/file)  │                        │
     │ ─────────────────► │                        │
     │                    │── validate structure ──│
     │                    │── check duplicates ────│
     │ ◄── preview+errors │    in DB               │
     │                    │                        │
     │  POST /commit      │                        │
     │  {rows: [...]}     │                        │
     │ ─────────────────► │                        │
     │                    │── insert_valid_rows ──►│
     │ ◄── stats report   │                        │
     │                    │                        │
```

---

## Verification Checklist

- [ ] `GET /api/displays/bulk-upload/template` downloads valid `.xlsx`
- [ ] Template contains `Displays` + `Instructions` sheets
- [ ] Template has data validation dropdown on `status` column
- [ ] Upload valid Excel → 200, `is_valid: true`, all rows valid
- [ ] Upload Excel with bad IP → 200, `is_valid: false`, row highlighted with error
- [ ] Upload Excel with duplicate display_id → flagged as intra-sheet duplicate
- [ ] Upload Excel with existing DB display_id → flagged as DB duplicate
- [ ] Upload non-Excel file → 422
- [ ] Upload >10MB → 422
- [ ] Missing column → 422 with explicit column name
- [ ] Commit valid preview → bulk insert, stats report returned
- [ ] Content profiles auto-created when missing

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `security-auditor` | **Critical.** Audit upload: decompression bomb protection (10MB limit), zip bombs, malicious XML in xlsx, path traversal in filename, mime type spoofing. Review openpyxl read_only mode for memory safety |
| `reviewer` | Verify all validation rules match spec §6.1 and §6.2 exactly. Check error response format matches §4.3 |
| `test-runner` | (Deferred — but write unit tests for ip validation, duplicate detection, auto-create profile logic) |