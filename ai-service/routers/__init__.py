# routers/__init__.py
from .forecasting import router as forecasting_router
from .procurement import router as procurement_router
from .chat import router as chat_router

__all__ = ["forecasting_router", "procurement_router", "chat_router"]
