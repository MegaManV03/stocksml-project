from sqlalchemy import DECIMAL, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, Table, DATE, Enum, BIGINT, DATETIME
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum('guest', 'member', 'admin', name='user_roles'), default='guest') 
    created_at = Column(DateTime, default=datetime.utcnow)


class UserCompanyAccess(Base):
    __tablename__ = 'user_company_access'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))  # ADDED: Link to User
    company_id = Column(Integer, ForeignKey('companies.id'))  # ADDED: Link to Company
    granted_by = Column(Integer, ForeignKey('users.id'))  # ADDED: Link to User
    granted_at = Column(DateTime, default=datetime.utcnow)

class Sector(Base):
    __tablename__ = 'sectors'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime)

    companies = relationship("Company", back_populates="sector")

class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    symbol = Column(String(10), nullable=False)                    # AAPL, TSLA
    company_name = Column(String(100), nullable=False)            # Apple Inc.
    market_cap = Column(DECIMAL(15, 2))                           # 2800000000000.00
    pe_ratio = Column(DECIMAL(10, 2))                             # 28.50
    eps = Column(DECIMAL(10, 2))                                  # 6.15
    revenue = Column(DECIMAL(15, 2))                              # 383300000000.00
    profit_margin = Column(DECIMAL(5, 2))                         # 25.31
    debt_to_equity = Column(DECIMAL(10, 2))                       # 1.20
    next_earnings_date = Column(DATE)                             # 2024-01-25
    earnings_estimate = Column(DECIMAL(10, 2))                    # 1.45
    dividend_yield = Column(DECIMAL(5, 2))                        # 0.55
    last_updated = Column(DATETIME, default=datetime.now)         # 2024-01-15 09:30:00

    sector = relationship("Sector", back_populates="companies")  # ADDED
    analyses = relationship("Analysis", back_populates="company")  # ADDED

class Analysis(Base):
    __tablename__ = 'analyses'
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'))  # LINK TO COMPANY
    
    # HISTORICAL DATA (from StockHistory)
    date = Column(DateTime)
    open_price = Column(DECIMAL(10, 2))
    close_price = Column(DECIMAL(10, 2))
    high_price = Column(DECIMAL(10, 2))
    low_price = Column(DECIMAL(10, 2))
    volume = Column(BIGINT)
    
    # PREDICTION DATA (from StockPrediction)
    predicted_high = Column(DECIMAL(10, 2))
    predicted_low = Column(DECIMAL(10, 2))
    predicted_open = Column(DECIMAL(10, 2))
    predicted_close = Column(DECIMAL(10, 2))
    signal = Column(Enum('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL'))
    confidence_score = Column(DECIMAL(3, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="analyses")
