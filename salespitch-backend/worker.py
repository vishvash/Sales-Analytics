# worker.py
import uvicorn
from src.config import settings

if __name__ == "__main__":
    print(settings)
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info",
        timeout_keep_alive=350,  # Increase keep-alive timeout to 120 seconds
    ) 
