from typing import Optional
from pydantic import field_validator
from app.schemas.base import CustomModel


class Persona(CustomModel):
    name: str
    age: int
    gender: str
    city: str
    occupation: str
    education: str
    interests: list[str]
    daily_habits: str
    personality_tone: str
    motivation: Optional[str] = None

    def to_prompt_text(self) -> str:
        interests_str = ", ".join(self.interests)
        lines = [
            f"Nama: {self.name}",
            f"Usia: {self.age} tahun",
            f"Jenis Kelamin: {self.gender}",
            f"Kota: {self.city}",
            f"Pekerjaan: {self.occupation}",
            f"Pendidikan: {self.education}",
            f"Minat: {interests_str}",
            f"Kebiasaan Sehari-hari: {self.daily_habits}",
            f"Kepribadian & Gaya Bicara: {self.personality_tone}",
        ]
        if self.motivation:
            lines.append(f"Motivasi Mengisi Form: {self.motivation}")
        return "\n".join(lines)


class AnswerMap(CustomModel):
    answers: dict[str, str | list[str]]

    @field_validator("answers")
    @classmethod
    def validate_entry_keys(cls, v: dict) -> dict:
        for key in v:
            if not key.startswith("entry."):
                raise ValueError(f"Invalid entry key: '{key}'. Must start with 'entry.'")
        return v


class GenerateRequest(CustomModel):
    form_schema: dict
    persona_text: str


class GenerateResponse(CustomModel):
    answers: dict[str, str | list[str]]
    tokens_used: int = 0
    retries: int = 0
