from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment, effects
import os
import shutil

router = APIRouter()

@router.post("/api/audio/edit")
async def edit_audio(
    file: UploadFile = File(...),
    volume: float = Form(...),  # 音量调整值（dB）
    fade_in: float = Form(0),   # 淡入时长（秒）
    fade_out: float = Form(0),  # 淡出时长（秒）
    normalize: bool = Form(False)  # 是否标准化音量
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
            
            # 应用音频效果
            if normalize:
                audio = effects.normalize(audio)
            
            if volume != 0:
                audio = audio + volume  # 调整音量
            
            if fade_in > 0:
                audio = audio.fade_in(int(fade_in * 1000))
                
            if fade_out > 0:
                audio = audio.fade_out(int(fade_out * 1000))
            
            # 导出处理后的音频
            output_filename = f"edited_{file.filename}"
            output_file_path = f"temp/{output_filename}"
            
            # 获取原始格式
            file_format = os.path.splitext(file.filename)[1][1:].lower()
            
            # 导出文件
            audio.export(output_file_path, format=file_format)
            
            # 读取处理后的文件
            with open(output_file_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "ogg": "audio/ogg",
                "m4a": "audio/mp4",
                "flac": "audio/flac"
            }
            
            return Response(
                content=processed_file,
                media_type=content_types.get(file_format, "application/octet-stream"),
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}"',
                    "Access-Control-Expose-Headers": "Content-Disposition",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error editing audio: {str(e)}")
            
    finally:
        # 清理临时文件
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
        if 'output_file_path' in locals() and os.path.exists(output_file_path):
            os.remove(output_file_path) 