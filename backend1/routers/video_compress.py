from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
from typing import Optional
import shutil
import logging

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

# 获取当前文件所在目录的绝对路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 创建临时文件夹用于存储上传和压缩的视频
TEMP_DIR = os.path.join(BASE_DIR, "temp_videos")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR, exist_ok=True)
    logger.info(f"创建临时目录: {TEMP_DIR}")

# 设置最大文件大小（1GB）
MAX_FILE_SIZE = 1024 * 1024 * 1024

def cleanup_files(input_path: str, output_path: str):
    """清理临时文件的后台任务"""
    try:
        if input_path and os.path.exists(input_path):
            os.remove(input_path)
            logger.info(f"已删除输入文件: {input_path}")
        if output_path and os.path.exists(output_path):
            os.remove(output_path)
            logger.info(f"已删除输出文件: {output_path}")
    except Exception as e:
        logger.error(f"清理临时文件时出错: {str(e)}")

@router.post("/api/video/compress")
async def compress_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    quality: str = "medium",
    resolution: Optional[str] = None
):
    input_path = None
    output_path = None

    try:
        logger.info(f"开始处理视频压缩请求: quality={quality}, resolution={resolution}")
        logger.info(f"上传文件类型: {video.content_type}")

        # 验证文件格式
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 生成唯一的文件名
        input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        output_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        
        input_path = os.path.join(TEMP_DIR, input_filename)
        output_path = os.path.join(TEMP_DIR, output_filename)

        logger.info(f"保存上传文件到: {input_path}")

        # 保存上传的视频
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # 获取文件大小
        file_size = os.path.getsize(input_path)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过限制（最大1GB）")

        logger.info("开始视频压缩")

        try:
            # 设置压缩参数
            bitrate = {
                "high": "2000k",
                "medium": "1000k",
                "low": "500k"
            }.get(quality, "1000k")

            # 设置基本的 FFmpeg 命令
            command = [
                'ffmpeg',
                '-i', input_path,
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-b:v', bitrate,
                '-c:a', 'aac',
                '-b:a', '128k'
            ]

            # 添加分辨率设置
            if resolution and resolution != "original":
                if resolution == "1080p":
                    command.extend(['-vf', 'scale=1920:1080'])
                elif resolution == "720p":
                    command.extend(['-vf', 'scale=1280:720'])
                elif resolution == "480p":
                    command.extend(['-vf', 'scale=854:480'])

            # 添加输出文件
            command.extend(['-y', output_path])

            logger.info(f"FFmpeg 命令: {' '.join(command)}")

            # 执行压缩
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                error_message = stderr.decode()
                logger.error(f"FFmpeg 错误: {error_message}")
                raise HTTPException(status_code=500, detail="视频压缩失败，请重试")

            logger.info("视频压缩完成")

            # 检查输出文件是否存在和有效
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise HTTPException(status_code=500, detail="视频压缩失败：输出文件无效")

            # 添加后台任务来清理文件
            background_tasks.add_task(cleanup_files, input_path, output_path)

            # 返回压缩后的视频
            return FileResponse(
                output_path,
                media_type=video.content_type,
                filename=f"compressed_{video.filename}"
            )

        except subprocess.CalledProcessError as e:
            error_message = e.stderr.decode() if e.stderr else str(e)
            logger.error(f"FFmpeg 错误: {error_message}")
            raise HTTPException(status_code=500, detail="视频压缩失败，请重试")

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        # 如果出错，立即清理文件
        cleanup_files(input_path, output_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试") 