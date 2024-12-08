from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
import shutil
import logging
from typing import List

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

# 获取当前文件所在目录的绝对路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 创建临时文件夹
TEMP_DIR = os.path.join(BASE_DIR, "temp_videos")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR, exist_ok=True)
    logger.info(f"创建临时目录: {TEMP_DIR}")

# 设置最大文件大小（1GB）
MAX_FILE_SIZE = 1024 * 1024 * 1024

def cleanup_files(*file_paths):
    """清理临时文件"""
    for file_path in file_paths:
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"已删除临时文件: {file_path}")
        except Exception as e:
            logger.error(f"清理临时文件时出错: {str(e)}")

@router.post("/api/video/merge")
async def merge_videos(
    background_tasks: BackgroundTasks,
    videos: List[UploadFile] = File(...)
):
    if len(videos) < 2:
        raise HTTPException(status_code=400, detail="请至少上传两个视频文件")

    input_paths = []
    output_path = None
    file_list_path = None

    try:
        # 保存上传的视频文件
        for video in videos:
            if not video.content_type.startswith('video/'):
                raise HTTPException(status_code=400, detail="请上传视频文件")

            input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
            input_path = os.path.join(TEMP_DIR, input_filename)
            input_paths.append(input_path)

            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)

            file_size = os.path.getsize(input_path)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="文件大小超过限制（最大1GB）")

        # 创建文件列表
        file_list_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.txt")
        with open(file_list_path, 'w') as f:
            for path in input_paths:
                f.write(f"file '{path}'\n")

        # 设置输出文件路径
        output_filename = f"{uuid.uuid4()}.mp4"
        output_path = os.path.join(TEMP_DIR, output_filename)

        # 执行合并命令
        command = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', file_list_path,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            output_path
        ]

        logger.info(f"FFmpeg 命令: {' '.join(command)}")

        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode()
            logger.error(f"FFmpeg 错误: {error_message}")
            raise HTTPException(status_code=500, detail="视频合并失败，请重试")

        # 检查输出文件
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=500, detail="视频合并失败：输出文件无效")

        # 添加清理任务
        cleanup_paths = input_paths + [file_list_path, output_path]
        background_tasks.add_task(cleanup_files, *cleanup_paths)

        return FileResponse(
            output_path,
            media_type='video/mp4',
            filename='merged_video.mp4'
        )

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        cleanup_paths = input_paths + ([file_list_path] if file_list_path else []) + ([output_path] if output_path else [])
        cleanup_files(*cleanup_paths)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试") 