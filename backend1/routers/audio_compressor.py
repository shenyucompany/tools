from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment
import os
import shutil

router = APIRouter()

@router.post("/api/audio/compress")
async def compress_audio(
    file: UploadFile = File(...),
    quality: int = Form(...),
    output_format: str = Form(...)
):
    # 创建临时目录
    os.makedirs("temp", exist_ok=True)

    try:
        # 保存上传的文件
        input_file_path = f"temp/{file.filename}"
        try:
            with open(input_file_path, "wb") as buffer:
                content = await file.read()
                if not content:
                    raise HTTPException(status_code=400, detail="Empty file")
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error saving file: {str(e)}")

        try:
            # 加载音频文件
            audio = AudioSegment.from_file(input_file_path)
            
            # 导出压缩后的音频
            output_filename = f"compressed_{os.path.splitext(file.filename)[0]}.{output_format}"
            output_file_path = f"temp/{output_filename}"
            
            # 设置压缩参数
            export_params = {
                "format": output_format,
                "bitrate": f"{quality}k"
            }
            
            # 如果是MP3格式，添加特定参数
            if output_format == "mp3":
                export_params.update({
                    "codec": "libmp3lame",
                    "parameters": ["-q:a", "2"]
                })
            
            # 导出文件
            audio.export(output_file_path, **export_params)
            
            # 读取压缩后的文件
            with open(output_file_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "ogg": "audio/ogg",
                "m4a": "audio/mp4"
            }
            
            return Response(
                content=processed_file,
                media_type=content_types.get(output_format, "application/octet-stream"),
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}"',
                    "Access-Control-Expose-Headers": "Content-Disposition",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error compressing audio: {str(e)}")
            
    finally:
        # 清理临时文件
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
        if 'output_file_path' in locals() and os.path.exists(output_file_path):
            os.remove(output_file_path) 