from typing import Annotated, TypeAlias
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from app.config import get_settings


def get_engine():
    settings = get_settings()
    connect_args = {"check_same_thread": False}
    return create_engine(settings.database_url, connect_args=connect_args)


engine = get_engine()


def create_db_and_tables():
    import app.models  # noqa: F401 — ensure all models are registered
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep: TypeAlias = Annotated[Session, Depends(get_session)]
