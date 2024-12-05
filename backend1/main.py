import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import pdf_converter, video_converter, video_compress, video_trim

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(pdf_converter.router)
app.include_router(video_converter.router)
app.include_router(video_compress.router)
app.include_router(video_trim.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 