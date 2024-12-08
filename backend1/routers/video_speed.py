from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
import shutil
import logging

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

@router.post("/api/video/speed")
async def adjust_speed(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    speed: float = Form(...)
):
    input_path = None
    output_path = None

    try:
        # 验证文件格式
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 验证速度范围
        if speed <= 0 or speed > 4:
            raise HTTPException(status_code=400, detail="速度倍率必须在0-4之间")

        # 保存上传的视频
        input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        output_filename = f"{uuid.uuid4()}.mp4"
        
        input_path = os.path.join(TEMP_DIR, input_filename)
        output_path = os.path.join(TEMP_DIR, output_filename)

        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # 检查文件大小
        file_size = os.path.getsize(input_path)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过限制（最大1GB）")

        # 设置FFmpeg命令
        command = [
            'ffmpeg',
            '-i', input_path,
            '-filter_complex', f'[0:v]setpts={1/speed}*PTS[v];[0:a]atempo={speed}[a]',
            '-map', '[v]',
            '-map', '[a]',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            output_path
        ]

        logger.info(f"FFmpeg 命令: {' '.join(command)}")

        # 执行命令
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            error_message = stderr.decode()
            logger.error(f"FFmpeg 错误: {error_message}")
            raise HTTPException(status_code=500, detail="调整速度失败，请重试")

        # 检查输出文件
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=500, detail="调整速度失败：输出文件无效")

        # 添加清理任务
        background_tasks.add_task(cleanup_files, input_path, output_path)

        return FileResponse(
            output_path,
            media_type='video/mp4',
            filename=f"speed_{speed}x_{video.filename}"
        )

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        cleanup_files(input_path, output_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试") 