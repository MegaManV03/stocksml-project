from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, stocksML is working"}

@app.get("/stocks")
def get_stocks():
    return {"stocks": ["AAPL", "TSLA", "BTC", "META","GOOGL"]}

@app.get("/stocks/{stock_id}")
def get_stock(stock_id: str):
    return {"stock": stock_id, "price": 150.25}

@app.post("/login")
def login(username: str, password: str):
    return {"message": f"hello {username}", "status": "success"}