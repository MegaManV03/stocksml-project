# users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
import schemas
from routers.auth import get_current_user, get_password_hash, verify_password, get_current_admin

router = APIRouter()

# Change password
@router.patch("/users/me/password")
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update to new password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

# Get all users (admin only)
@router.get("/users", response_model=list[schemas.User])
async def get_users_list(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

# Delete my own account
@router.delete("/users/me")
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    
    return {
        "message": "Your account has been permanently deleted",
        "user_id": current_user.id
    }

# Delete any user account (admin only)
@router.delete("/users/{user_id}")
async def delete_user_account(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Prevent self-deletion via admin endpoint (optional safety)
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Use /users/me to delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {
        "message": f"User {user.username} deleted successfully",
        "deleted_user_id": user_id,
        "deleted_username": user.username
    }

# Change user role (admin only)
@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    role_data: schemas.RoleChange,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_data.role
    db.commit()
    
    return {
        "message": f"User role updated to {role_data.role}",
        "user_id": user_id,
        "username": user.username,
        "new_role": role_data.role
    }