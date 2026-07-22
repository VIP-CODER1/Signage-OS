from typing import List, Optional


class AppException(Exception):
    def __init__(self, detail: str, status_code: int = 400,
                 errors: Optional[List[dict]] = None):
        self.detail = detail
        self.status_code = status_code
        self.errors = errors or []


class DuplicateDisplayIdError(AppException):
    def __init__(self, display_id: str):
        super().__init__(
            detail=f"Display ID '{display_id}' already exists",
            status_code=400,
            errors=[{"field": "display_id", "message": "Display ID already exists"}],
        )


class DisplayNotFoundError(AppException):
    def __init__(self):
        super().__init__(detail="Display not found", status_code=404)


class ExcelParseError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=422)


class DatabaseTimeoutError(AppException):
    def __init__(self):
        super().__init__(
            detail="Database connection timeout",
            status_code=503,
        )


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class ValidationError_(AppException):
    def __init__(self, detail: str = "Validation failed",
                 errors: Optional[List[dict]] = None):
        super().__init__(detail=detail, status_code=422, errors=errors)
