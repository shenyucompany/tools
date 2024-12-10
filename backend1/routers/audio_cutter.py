from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from pydub import AudioSegment
import os
import shutil
from typing import Optional

router = APIRouter()

@router.post("/api/audio/cut")
async def cut_audio(
    file: UploadFile = File(...),
    start_time: float = Form(...),
    end_time: float = Form(...)
):
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="Start time must be less than end time")

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
            # 获取文件格式
            file_ext = os.path.splitext(file.filename)[1][1:].lower()
            
            # 加载音频文件
            if file_ext == 'mp3':
                audio = AudioSegment.from_mp3(input_file_path)
            elif file_ext == 'wav':
                audio = AudioSegment.from_wav(input_file_path)
            elif file_ext == 'ogg':
                audio = AudioSegment.from_ogg(input_file_path)
            else:
                audio = AudioSegment.from_file(input_file_path)
            
            # 转换时间为毫秒
            start_ms = int(start_time * 1000)
            end_ms = int(end_time * 1000)
            
            # 剪切音频
            cut_audio = audio[start_ms:end_ms]
            
            # 导出剪切后的音频
            output_filename = f"cut_{os.path.splitext(file.filename)[0]}{os.path.splitext(file.filename)[1]}"
            output_file_path = f"temp/{output_filename}"
            cut_audio.export(output_file_path, format=file_ext)
            
            # 读取处理后的文件
            with open(output_file_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type和其他响应头
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "ogg": "audio/ogg",
                "m4a": "audio/mp4",
                "flac": "audio/flac"
            }

            headers = {
                "Content-Disposition": f'attachment; filename="{output_filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Expires": "0"
            }
                
            return Response(
                content=processed_file,
                media_type=content_types.get(file_ext, "application/octet-stream"),
                headers=headers
            )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
        
    finally:
        # 清理临时文件
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
        if 'output_file_path' in locals() and os.path.exists(output_file_path):
            os.remove(output_file_path) 