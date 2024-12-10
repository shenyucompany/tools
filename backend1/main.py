import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    pdf_converter, video_converter, video_compress, video_trim, 
    video_merge, video_watermark, video_extract, video_speed, video_rotate,
    audio_converter, audio_cutter, audio_merger
)

app = FastAPI()

# 配置CORS，允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头部
    expose_headers=["Content-Disposition"]  # 允许前端访问Content-Disposition头
)

# 注册路由
app.include_router(pdf_converter.router)
app.include_router(video_converter.router)
app.include_router(video_compress.router)
app.include_router(video_trim.router)
app.include_router(video_merge.router)
app.include_router(video_watermark.router)
app.include_router(video_extract.router)
app.include_router(video_speed.router)
app.include_router(video_rotate.router)
app.include_router(audio_converter.router)
app.include_router(audio_cutter.router)
app.include_router(audio_merger.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 