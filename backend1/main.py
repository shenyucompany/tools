import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from routers import (
    pdf_converter, video_converter, video_compress, video_trim, 
    video_merge, video_watermark, video_extract, video_speed, video_rotate,
    audio_converter, audio_cutter, audio_merger, audio_compressor, audio_editor,
    audio_recorder, audio_effects, audio_extract, format_converter,
    image_to_pdf
)

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://qinlipdf.netlify.app",  # 生产环境
        "http://127.0.0.1:5500",         # Live Server默认地址
        "http://localhost:5500",         # Live Server可能的地址
        "http://localhost:3000",         # 开发环境
        "http://localhost:5000",         # 开发环境
        "null",                          # 允许来自本地文件的请求
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With",
        "If-Modified-Since",
        "Keep-Alive",
        "X-File-Name",
    ],
    expose_headers=["Content-Disposition", "Content-Length"],
    max_age=3600,
)

# 添加CORS预检请求处理
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    return JSONResponse(
        content="OK",
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        },
    )

# 注册路由
app.include_router(image_to_pdf.router)
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
app.include_router(audio_compressor.router)
app.include_router(audio_editor.router)
app.include_router(audio_recorder.router)
app.include_router(audio_effects.router)
app.include_router(audio_extract.router)
app.include_router(format_converter.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 