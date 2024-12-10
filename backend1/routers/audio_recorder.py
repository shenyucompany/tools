from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment
import os
import shutil
import base64
import json

router = APIRouter()

@router.post("/api/audio/record/save")
async def save_recording(
    audio_data: str = Form(...),  # Base64编码的音频数据
    format: str = Form(...),      # 音频格式
    name: str = Form(...)         # 文件名
):
    # 创建临时目录
    os.makedirs("temp", exist_ok=True)
    
    # 初始化变量
    temp_path = None
    output_path = None
    
    try:
        # 解码Base64音频数据
        try:
            # 检查是否包含data URI scheme
            if ',' in audio_data:
                audio_data = audio_data.split(',')[1]
            audio_bytes = base64.b64decode(audio_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid audio data: {str(e)}")
        
        # 保存临时文件
        temp_path = f"temp/temp_recording.wav"
        try:
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving temporary file: {str(e)}")
        
        # 转换音频格式
        try:
            # 加载音频文件
            audio = AudioSegment.from_file(temp_path)
            output_path = f"temp/{name}.{format}"
            
            # 导出文件
            audio.export(output_path, format=format)
            
            # 读取处理后的文件
            with open(output_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "ogg": "audio/ogg"
            }
            
            return Response(
                content=processed_file,
                media_type=content_types.get(format, "application/octet-stream"),
                headers={
                    "Content-Disposition": f'attachment; filename="{name}.{format}"',
                    "Access-Control-Expose-Headers": "Content-Disposition"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
        
    finally:
        # 清理临时文件
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        if output_path and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass

@router.post("/api/audio/record/edit")
async def edit_recording(
    file: UploadFile = File(...),
    start_time: float = Form(0),
    end_time: float = Form(0),
    volume: float = Form(0),
    format: str = Form(...)
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
            
            # 应用编辑
            if start_time > 0 or end_time > 0:
                start_ms = int(start_time * 1000)
                end_ms = int(end_time * 1000) if end_time > 0 else len(audio)
                audio = audio[start_ms:end_ms]
            
            if volume != 0:
                audio = audio + volume
            
            # 导出处理后的音频
            output_filename = f"edited_{os.path.splitext(file.filename)[0]}.{format}"
            output_file_path = f"temp/{output_filename}"
            
            # 导出文件
            audio.export(output_file_path, format=format)
            
            # 读取处理后的文件
            with open(output_file_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "ogg": "audio/ogg"
            }
            
            return Response(
                content=processed_file,
                media_type=content_types.get(format, "application/octet-stream"),
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}"',
                    "Access-Control-Expose-Headers": "Content-Disposition"
                }
            )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error editing recording: {str(e)}")
            
    finally:
        # 清理临时文件
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
        if 'output_file_path' in locals() and os.path.exists(output_file_path):
            os.remove(output_file_path) 