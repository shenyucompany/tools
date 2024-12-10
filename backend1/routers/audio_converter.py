from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment
import os
import shutil

router = APIRouter()

@router.post("/api/audio/convert")
async def convert_audio(file: UploadFile = File(...), target_format: str = "mp3"):
    # 检查目标格式是否支持
    supported_formats = ["mp3", "wav", "flac", "aac"]
    if target_format not in supported_formats:
        raise HTTPException(status_code=400, detail="Unsupported target format")

    # 创建临时目录（如果不存在）
    os.makedirs("temp", exist_ok=True)

    try:
        # 保存上传的文件，使用原始文件名
        input_file_path = f"temp/{file.filename}"
        with open(input_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 获取文件格式
        input_format = os.path.splitext(file.filename)[1][1:].lower()
        
        # 转换音频格式
        try:
            # 根据输入格式指定加载方法
            if input_format == "mp3":
                audio = AudioSegment.from_mp3(input_file_path)
            elif input_format == "wav":
                audio = AudioSegment.from_wav(input_file_path)
            elif input_format == "ogg":
                audio = AudioSegment.from_ogg(input_file_path)
            else:
                # 对于其他格式，尝试自动检测
                audio = AudioSegment.from_file(input_file_path)

            # 导出为目标格式
            output_filename = f"converted_{os.path.splitext(file.filename)[0]}.{target_format}"
            output_file_path = f"temp/{output_filename}"
            audio.export(output_file_path, format=target_format)
            
            # 读取转换后的文件
            with open(output_file_path, "rb") as f:
                converted_file = f.read()

            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "flac": "audio/flac",
                "aac": "audio/aac"
            }
            
            return Response(
                content=converted_file,
                media_type=content_types.get(target_format, "application/octet-stream"),
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}"'
                }
            )

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error converting audio: {str(e)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
        
    finally:
        # 清理临时文件
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
        if 'output_file_path' in locals() and os.path.exists(output_file_path):
            os.remove(output_file_path)