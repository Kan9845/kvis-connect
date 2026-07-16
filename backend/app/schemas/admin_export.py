from pydantic import BaseModel, Field


class AdminExportField(BaseModel):
    key: str
    label: str
    description: str
    category: str
    sensitive: bool
    default_selected: bool = False


class AdminExportRequest(BaseModel):
    fields: list[str] = Field(min_length=1, max_length=64)
    include_deleted: bool = False
    acknowledge_sensitive: bool = False


class AdminExportPreview(BaseModel):
    columns: list[str]
    rows: list[list[str]]
    total_rows: int
    estimated_size_bytes: int
    masked: bool = True
