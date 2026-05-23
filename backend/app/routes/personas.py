from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.db import SessionDep
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaRead, PersonaUpdate

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.post("/", response_model=PersonaRead, status_code=201)
def create_persona(persona: PersonaCreate, session: SessionDep):
    db_persona = Persona(**persona.model_dump())
    session.add(db_persona)
    session.commit()
    session.refresh(db_persona)
    return db_persona


@router.get("/", response_model=list[PersonaRead])
def list_personas(session: SessionDep):
    return session.exec(select(Persona)).all()


@router.get("/{persona_id}", response_model=PersonaRead)
def get_persona(persona_id: int, session: SessionDep):
    persona = session.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona


@router.patch("/{persona_id}", response_model=PersonaRead)
def update_persona(persona_id: int, updates: PersonaUpdate, session: SessionDep):
    persona = session.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    data = updates.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(persona, key, value)
    persona.updated_at = datetime.now(timezone.utc)
    session.add(persona)
    session.commit()
    session.refresh(persona)
    return persona


@router.delete("/{persona_id}", status_code=204)
def delete_persona(persona_id: int, session: SessionDep):
    persona = session.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    session.delete(persona)
    session.commit()
