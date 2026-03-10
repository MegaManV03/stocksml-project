from sqlalchemy import Column,Index, Integer, String, Boolean, DateTime, Text, ForeignKey, DECIMAL, Table, DATE, BIGINT
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ENUM
from datetime import datetime, timezone

Base = declarative_base()



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(ENUM('guest', 'member', 'admin', name='user_roles'), default='guest')
    created_at = Column(DateTime, default=datetime.now(timezone.utc))  # Keep as DateTime


class UserCompanyAccess(Base):
    __tablename__ = 'user_company_access'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    company_id = Column(Integer, ForeignKey('companies.id'))
    granted_by = Column(Integer, ForeignKey('users.id'))
    granted_at = Column(DateTime, default=datetime.now(timezone.utc))  # Keep as DateTime


class Sector(Base):
    __tablename__ = 'sectors'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))  # CHANGED: Add default


class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    symbol = Column(String(10))
    company_name = Column(String(100))
    market_cap = Column(DECIMAL(15, 2), nullable=True)
    pe_ratio = Column(DECIMAL(10, 2), nullable=True)
    eps = Column(DECIMAL(10, 2), nullable=True)
    revenue = Column(DECIMAL(15, 2), nullable=True)
    profit_margin = Column(DECIMAL(5, 2), nullable=True)
    debt_to_equity = Column(DECIMAL(10, 2), nullable=True)
    next_earnings_date = Column(DATE, nullable=True)
    earnings_estimate = Column(DECIMAL(10, 2), nullable=True)
    dividend_yield = Column(DECIMAL(5, 2), nullable=True)
    last_updated = Column(DateTime, default=datetime.now(timezone.utc), nullable=True)


class Analysis(Base):
    __tablename__ = 'analyses'
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'))
    
    date = Column(DateTime)  # Keep as DateTime
    open_price = Column(DECIMAL(10, 2))
    close_price = Column(DECIMAL(10, 2))
    high_price = Column(DECIMAL(10, 2))
    low_price = Column(DECIMAL(10, 2))
    volume = Column(BIGINT)
    
    predicted_high = Column(DECIMAL(10, 2))
    predicted_low = Column(DECIMAL(10, 2))
    predicted_open = Column(DECIMAL(10, 2))
    predicted_close = Column(DECIMAL(10, 2))
    signal = Column(ENUM('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL', name='analysis_signal'))
    confidence_score = Column(DECIMAL(3, 2))
    
    created_at = Column(DateTime, default=datetime.now(timezone.utc))  # Keep as DateTime

class Stock_Prices(Base):
    __tablename__ = "stock_prices"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'))

    timestamp = Column(ENUM('1m', '5m', '15m', '30m', '1h', '4h', '1d'), name='timestamp')
    date = Column(DateTime)
    open_price = Column(DECIMAL(10, 2))
    high_price = Column(DECIMAL(10, 2))
    close_price = Column(DECIMAL(10, 2))
    low_price = Column(DECIMAL(10, 2))
    volume = Column(BIGINT)

    __table_args__ = (
        Index('idx_company_date', 'company_id', 'date'),
    )


class Price_Predictions(Base):
    __tablename__ = "price_predictions"
    
    id = Column(Integer, primary_key=True)
    stock_price_id = Column(Integer, ForeignKey('stock_prices.id')) 
    prediction_date = Column(DateTime, default=datetime.now(timezone.utc))  
    long_probability = Column(DECIMAL(5, 4))  
    short_probability = Column(DECIMAL(5, 4)) 
    model_version = Column(String(50))  


# Add the relationships after class definitions
Sector.companies = relationship("Company", back_populates="sector")
Company.sector = relationship("Sector", back_populates="companies")
Company.analyses = relationship("Analysis", back_populates="company")
Analysis.company = relationship("Company", back_populates="analyses")

Company.stock_prices = relationship("Stock_Prices", back_populates='company')

Stock_Prices.company = relationship("Company", back_populates='stock_prices')
Stock_Prices.predictions = relationship("Price_Predictions", back_populates='stock_price')

Price_Predictions.stock_price = relationship("Stock_Prices", back_populates='predictions')  