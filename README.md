# Stock Analysis API

FastAPI stock analysis platform with sectors, companies, and trading analyses.

## Features
- Sector & company management
- Stock analysis with predictions  
- User authentication & roles
- REST API endpoints

## Tech Stack
- FastAPI + Python
- SQLAlchemy + SQL
- JWT authentication
- Pydantic validation

## Database Models
- Users (admin, member, guest roles)
- Sectors (Technology, Healthcare, etc.)
- Companies (stocks with financial data)
- Analyses (trading analysis with signals)

## Key Endpoints
- `GET /sectors/{id}/companies/{id}/analyses` - Get company analyses
- `POST /analyses/` - Create new analysis
- `POST /auth/login` - User authentication
- `GET /api/v1/users` - User management (admin)

## Authentication
JWT token required for protected routes. Three user roles with different permissions.

## Default Admin
- Username: `kri`
- Password: `kri`
- Role: `admin`

## Analysis Signals
- BUY, SELL, HOLD, STRONG_BUY, STRONG_SELL
- Confidence scores (0-100)
- Price predictions and historical data

Run with:
`cd .\backend\`
`uvicorn main:app --reload`