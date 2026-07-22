from pydantic import BaseModel
from typing import List, Optional


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


class CommitRequest(BaseModel):
    rows: List[dict]


class CommitResponse(BaseModel):
    inserted: int
    failed: int
    total: int
    errors: List[dict] = []
