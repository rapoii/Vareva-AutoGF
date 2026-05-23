from datetime import datetime
from typing import Optional
from app.schemas.base import CustomModel


class PersonaCreate(CustomModel):
    name: str
    description: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: str


class PersonaUpdate(CustomModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: Optional[str] = None


class PersonaRead(CustomModel):
    id: int
    name: str
    description: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
