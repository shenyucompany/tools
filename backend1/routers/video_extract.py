from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
import shutil
import logging
import zipfile
import glob
from pathlib import Path

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

@router.post("/api/video/extract")
async def extract_audio(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    format: str = Form(...),
    quality: str = Form(...)
):
    input_path = None
    output_path = None

    try:
        # 验证文件格式
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 验证输出格式
        if format not in ['mp3', 'aac', 'wav']:
            raise HTTPException(status_code=400, detail="不支持的输出格式")

        # 保存上传的视频
        input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        output_filename = f"{uuid.uuid4()}.{format}"
        
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
            '-i', input_path
        ]

        # 根据不同格式设置编码器和参数
        if format == 'mp3':
            command.extend(['-c:a', 'libmp3lame', '-b:a', quality])
        elif format == 'aac':
            command.extend(['-c:a', 'aac', '-b:a', quality])
        elif format == 'wav':
            command.extend(['-c:a', 'pcm_s16le'])

        command.extend(['-y', output_path])

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
            raise HTTPException(status_code=500, detail="音频提取失败，请重试")

        # 检查输出文件
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=500, detail="音频提取失败：输出文件无效")

        # 添加清理任务
        background_tasks.add_task(cleanup_files, input_path, output_path)

        # 设置正确的MIME类型
        mime_types = {
            'mp3': 'audio/mpeg',
            'aac': 'audio/aac',
            'wav': 'audio/wav'
        }

        return FileResponse(
            output_path,
            media_type=mime_types[format],
            filename=f"extracted_audio.{format}"
        )

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        cleanup_files(input_path, output_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试")

@router.post("/api/video/extract-frames")
async def extract_frames(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    frame_rate: int = Form(...),
    image_format: str = Form(...)
):
    input_path = None
    output_dir = None
    zip_path = None

    try:
        # 验证文件格式
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 验证输出格式
        if image_format not in ['jpg', 'png']:
            raise HTTPException(status_code=400, detail="不支持的图片格式")

        # 保存上传的视频
        input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        input_path = os.path.join(TEMP_DIR, input_filename)

        # 创建输出目录
        output_dir = os.path.join(TEMP_DIR, str(uuid.uuid4()))
        os.makedirs(output_dir, exist_ok=True)

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
            '-vf', f'fps={frame_rate}',
            '-frame_pts', '1',  # 添加时间戳到文件名
            os.path.join(output_dir, f'frame_%d.{image_format}')
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
            raise HTTPException(status_code=500, detail="视频帧提取失败，请重试")

        # 创建ZIP文件
        zip_filename = f"{uuid.uuid4()}.zip"
        zip_path = os.path.join(TEMP_DIR, zip_filename)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for frame in sorted(glob.glob(os.path.join(output_dir, f'frame_*.{image_format}'))):
                frame_name = os.path.basename(frame)
                zipf.write(frame, frame_name)

        # 添加清理任务
        background_tasks.add_task(cleanup_files, input_path, zip_path)
        background_tasks.add_task(lambda: shutil.rmtree(output_dir, ignore_errors=True))

        return FileResponse(
            zip_path,
            media_type='application/zip',
            filename=f'frames_{Path(video.filename).stem}.zip'
        )

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        cleanup_files(input_path, zip_path)
        if output_dir:
            shutil.rmtree(output_dir, ignore_errors=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试") 