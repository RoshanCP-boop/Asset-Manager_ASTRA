from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import schemas, crud
from app.auth import require_roles, get_current_user
from app.models import UserRole, User

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=schemas.CategoryRead, dependencies=[Depends(require_roles(UserRole.ADMIN))])
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, payload)


@router.get("", response_model=list[schemas.CategoryRead])
def list_categories(
    category_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List categories. Optionally filter by category_type (HARDWARE or ACCESSORY)."""
    return crud.list_categories(db, category_type=category_type)
