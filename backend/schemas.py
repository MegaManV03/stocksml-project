from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
from datetime import datetime

class SectorBase(BaseModel):
    name: str
    description: Optional[str] = None

class SectorCreate(SectorBase):
    pass

class SectorUpdate(SectorBase):
    pass

class Sector(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class CompanyBase(BaseModel):
    sector_id: int
    symbol: str
    company_name: str
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    revenue: Optional[float] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

class AnalysisBase(BaseModel):
    company_id: int
    date: datetime
    open_price: float = 0.0
    close_price: float
    high_price: float = 0.0
    low_price: float = 0.0
    volume: int = 0
    predicted_high: float = 0.0
    predicted_low: float = 0.0
    predicted_open: float = 0.0
    predicted_close: float
    signal: Literal['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']
    confidence_score: float

class AnalysisCreate(AnalysisBase):
    pass

class AnalysisUpdate(AnalysisBase):
    pass

class Analysis(AnalysisBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Stock_Prices_Base(BaseModel):
    company_id: int
    timestamp: Literal['5min', '15min', '30min', '1h', '5h', '1d', '1w', '1m']
    date: datetime
    open_price: float=0.0
    high_price: float=0.0
    low_price: float=0.0
    close_price: float=0.0
    volume: int=0

class Stock_Prices_Create(Stock_Prices_Base):
    pass

class Stock_Prices_Update(Stock_Prices_Base):
    pass

class Stock_Prices(Stock_Prices_Base):
    id: int

    class Config:
        from_attributes = True

class Price_Predictions_Base(BaseModel):
    stock_price_id: int  
    long_probability: float  
    short_probability: float  
    model_version: str  
    prediction_date: datetime  

class Price_Predictions_Create(Price_Predictions_Base):
    pass

class Price_Predictions_Update(BaseModel):
    long_probability: Optional[float] = None
    short_probability: Optional[float] = None
    model_version: Optional[str] = None

class Price_Predictions(Price_Predictions_Base):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str
    role: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True



class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ChangePasswordResponse(BaseModel):
    message: str

# Role change  
class RoleChange(BaseModel):
    role: str  # 'guest', 'member', 'admin'

class ChangeRoleResponse(BaseModel):
    message: str
    user_id: int
    username: str
    new_role: str

# User responses
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str
    created_at: str

# Delete responses
class DeleteUserResponse(BaseModel):
    message: str
    user_id: int

class DeleteUserAdminResponse(BaseModel):
    message: str
    deleted_user_id: int
    deleted_username: str
