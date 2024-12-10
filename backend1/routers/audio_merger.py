from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment
import os
import shutil
import json
from typing import List

router = APIRouter()

@router.post("/api/audio/merge")
async def merge_audio(
    files: List[UploadFile] = File(...),
    file_order: str = Form(...),
    output_format: str = Form(...)
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 files are required")

    # 创建临时目录
    os.makedirs("temp", exist_ok=True)

    try:
        # 解析文件顺序
        file_order = json.loads(file_order)
        file_dict = {file.filename: file for file in files}
        
        # 按顺序处理文件
        merged_audio = None
        for filename in file_order:
            if filename not in file_dict:
                continue
                
            file = file_dict[filename]
            input_file_path = f"temp/{file.filename}"
            
            try:
                # 保存上传的文件
                with open(input_file_path, "wb") as buffer:
                    content = await file.read()
                    if not content:
                        continue
                    buffer.write(content)
                
                # 加载音频文件
                current_audio = AudioSegment.from_file(input_file_path)
                
                # 合并音频
                if merged_audio is None:
                    merged_audio = current_audio
                else:
                    merged_audio += current_audio
                    
            finally:
                # 清理临时文件
                if os.path.exists(input_file_path):
                    os.remove(input_file_path)
        
        if merged_audio is None:
            raise HTTPException(status_code=400, detail="No valid audio files to merge")
            
        # 导出合并后的音频
        output_filename = f"merged_audio.{output_format}"
        output_file_path = f"temp/{output_filename}"
        
        try:
            merged_audio.export(output_file_path, format=output_format)
            
            # 读取合并后的文件
            with open(output_file_path, "rb") as f:
                processed_file = f.read()
                
            # 设置正确的Content-Type
            content_types = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "ogg": "audio/ogg",
                "flac": "audio/flac"
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
        finally:
            if os.path.exists(output_file_path):
                os.remove(output_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error merging audio: {str(e)}") 