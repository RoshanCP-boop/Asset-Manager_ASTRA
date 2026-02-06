from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.db import get_db
from app import schemas, models
from app.auth import require_roles, get_current_user
from app.models import UserRole, User, Organization, Asset, AssetType, AssetStatus, AssetCondition

router = APIRouter(prefix="/organization", tags=["organization"])


@router.get("/current", response_model=schemas.OrganizationRead)
def get_current_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(404, "User is not part of an organization")
    
    org = db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    return org


@router.put("/current", response_model=schemas.OrganizationRead)
def update_organization(
    payload: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update organization settings. Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only admins can update organization settings")
    
    if not current_user.organization_id:
        raise HTTPException(404, "User is not part of an organization")
    
    org = db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    # Update fields if provided
    if payload.name is not None:
        org.name = payload.name
    if payload.logo_url is not None:
        org.logo_url = payload.logo_url if payload.logo_url else None
    if payload.employee_id_prefix is not None:
        org.employee_id_prefix = payload.employee_id_prefix.upper() if payload.employee_id_prefix else None
    
    db.commit()
    db.refresh(org)
    return org


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get organization dashboard statistics."""
    if not current_user.organization_id:
        raise HTTPException(404, "User is not part of an organization")
    
    org_id = current_user.organization_id
    org = db.get(Organization, org_id)
    
    # Total users
    total_users = db.query(func.count(User.id)).filter(
        User.organization_id == org_id,
        User.is_active == True
    ).scalar() or 0
    
    # Total assets
    total_assets = db.query(func.count(Asset.id)).filter(
        Asset.organization_id == org_id
    ).scalar() or 0
    
    # Assets by type
    hardware_count = db.query(func.count(Asset.id)).filter(
        Asset.organization_id == org_id,
        Asset.asset_type == AssetType.HARDWARE
    ).scalar() or 0
    
    software_count = db.query(func.count(Asset.id)).filter(
        Asset.organization_id == org_id,
        Asset.asset_type == AssetType.SOFTWARE
    ).scalar() or 0
    
    # Assets by status
    status_counts = {}
    for status in AssetStatus:
        count = db.query(func.count(Asset.id)).filter(
            Asset.organization_id == org_id,
            Asset.status == status
        ).scalar() or 0
        status_counts[status.value] = count
    
    # Assets by condition (hardware only)
    condition_counts = {}
    for condition in AssetCondition:
        count = db.query(func.count(Asset.id)).filter(
            Asset.organization_id == org_id,
            Asset.asset_type == AssetType.HARDWARE,
            Asset.condition == condition
        ).scalar() or 0
        condition_counts[condition.value] = count
    
    # Assets needing data wipe
    needs_data_wipe = db.query(func.count(Asset.id)).filter(
        Asset.organization_id == org_id,
        Asset.needs_data_wipe == True
    ).scalar() or 0
    
    # Upcoming warranty expirations (next 30 days)
    today = date.today()
    thirty_days = today + timedelta(days=30)
    
    warranty_expiring = db.query(Asset).filter(
        Asset.organization_id == org_id,
        Asset.asset_type == AssetType.HARDWARE,
        Asset.warranty_end != None,
        Asset.warranty_end >= today,
        Asset.warranty_end <= thirty_days
    ).all()
    
    # Upcoming software renewals (next 30 days)
    renewals_coming = db.query(Asset).filter(
        Asset.organization_id == org_id,
        Asset.asset_type == AssetType.SOFTWARE,
        Asset.renewal_date != None,
        Asset.renewal_date >= today,
        Asset.renewal_date <= thirty_days
    ).all()
    
    # Assets by category (top 10)
    category_stats = db.query(
        Asset.category, 
        func.count(Asset.id).label('count')
    ).filter(
        Asset.organization_id == org_id,
        Asset.asset_type == AssetType.HARDWARE,
        Asset.category != None
    ).group_by(Asset.category).order_by(func.count(Asset.id).desc()).limit(10).all()
    
    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "logo_url": org.logo_url,
            "employee_id_prefix": org.employee_id_prefix,
        },
        "totals": {
            "users": total_users,
            "assets": total_assets,
            "hardware": hardware_count,
            "software": software_count,
        },
        "status_breakdown": status_counts,
        "condition_breakdown": condition_counts,
        "needs_data_wipe": needs_data_wipe,
        "warranty_expiring_soon": [
            {
                "id": a.id,
                "asset_tag": a.asset_tag,
                "category": a.category,
                "model": a.model,
                "warranty_end": a.warranty_end.isoformat() if a.warranty_end else None,
            }
            for a in warranty_expiring
        ],
        "renewals_coming_soon": [
            {
                "id": a.id,
                "asset_tag": a.asset_tag,
                "subscription": a.subscription,
                "renewal_date": a.renewal_date.isoformat() if a.renewal_date else None,
                "seats_total": a.seats_total,
                "seats_used": a.seats_used,
            }
            for a in renewals_coming
        ],
        "category_breakdown": [
            {"category": cat, "count": count}
            for cat, count in category_stats
        ],
    }


@router.post("/generate-employee-id/{user_id}")
def generate_employee_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an employee ID for a user. Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only admins can generate employee IDs")
    
    if not current_user.organization_id:
        raise HTTPException(404, "User is not part of an organization")
    
    org = db.get(Organization, current_user.organization_id)
    if not org or not org.employee_id_prefix:
        raise HTTPException(400, "Organization has no employee ID prefix set")
    
    user = db.get(User, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(404, "User not found")
    
    if user.employee_id:
        raise HTTPException(400, "User already has an employee ID")
    
    # Find the next available number
    prefix = org.employee_id_prefix
    existing_ids = db.query(User.employee_id).filter(
        User.organization_id == org.id,
        User.employee_id != None,
        User.employee_id.like(f"{prefix}%")
    ).all()
    
    # Extract numbers and find max
    max_num = 0
    for (emp_id,) in existing_ids:
        if emp_id and emp_id.startswith(prefix):
            try:
                num = int(emp_id[len(prefix):])
                max_num = max(max_num, num)
            except ValueError:
                pass
    
    # Generate new ID
    new_id = f"{prefix}{str(max_num + 1).zfill(3)}"
    user.employee_id = new_id
    db.commit()
    
    return {"employee_id": new_id, "user_id": user_id}


@router.put("/users/{user_id}/employee-id")
def set_employee_id(
    user_id: int,
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually set an employee ID for a user. Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only admins can set employee IDs")
    
    user = db.get(User, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(404, "User not found")
    
    # Check for duplicates
    existing = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.employee_id == employee_id,
        User.id != user_id
    ).first()
    if existing:
        raise HTTPException(400, f"Employee ID {employee_id} is already in use")
    
    user.employee_id = employee_id
    db.commit()
    
    return {"employee_id": employee_id, "user_id": user_id}
