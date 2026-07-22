from pydantic import BaseModel
from typing import List, Optional


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    detail: str
    error_id: Optional[str] = None
    errors: Optional[List[FieldError]] = None
