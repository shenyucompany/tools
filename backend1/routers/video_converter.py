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

# 创建临时文件夹用于存储上传和转换的视频
TEMP_DIR = os.path.join(BASE_DIR, "temp_videos")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR, exist_ok=True)
    logger.info(f"创建临时目录: {TEMP_DIR}")

# 设置最大文件大小（1GB）
MAX_FILE_SIZE = 1024 * 1024 * 1024

# 支持的视频格式
SUPPORTED_FORMATS = {
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "wmv": "video/x-ms-wmv",
    "flv": "video/x-flv"
}

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

@router.post("/api/video/convert")
async def convert_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    output_format: str = "mp4",
    quality: str = "high",
    resolution: Optional[str] = None
):
    input_path = None
    output_path = None

    try:
        logger.info(f"开始处理视频转换请求: format={output_format}, quality={quality}, resolution={resolution}")
        logger.info(f"上传文件类型: {video.content_type}")
        logger.info(f"临时目录路径: {TEMP_DIR}")

        # 验证文件格式
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 验证输出格式
        if output_format not in SUPPORTED_FORMATS:
            raise HTTPException(status_code=400, detail="不支持的输出格式")

        # 生成唯一的文件名
        input_filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
        output_filename = f"{uuid.uuid4()}.{output_format}"
        
        input_path = os.path.join(TEMP_DIR, input_filename)
        output_path = os.path.join(TEMP_DIR, output_filename)

        logger.info(f"保存上传文件到: {input_path}")

        # 确保临时目录存在
        os.makedirs(TEMP_DIR, exist_ok=True)

        # 保存上传的视频
        try:
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
        except Exception as e:
            logger.error(f"保存文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"保存文件失败: {str(e)}")

        # 验证文件是否成功保存
        if not os.path.exists(input_path):
            raise HTTPException(status_code=500, detail="文件保存失败")

        # 获取文件大小
        file_size = os.path.getsize(input_path)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过限制（最大1GB）")

        logger.info("开始视频转换")

        try:
            # 检查 ffmpeg 是否可用
            try:
                subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
            except subprocess.CalledProcessError:
                raise HTTPException(status_code=500, detail="FFmpeg 未安装或不可用")

            # 设置基本的 FFmpeg 命令
            command = ['ffmpeg', '-i', input_path]

            # 设置视频编码器和比特率
            bitrate = {
                "high": "2000k",
                "medium": "1000k",
                "low": "500k"
            }.get(quality, "1000k")

            command.extend(['-c:v', 'libx264', '-b:v', bitrate])

            # 设置音频编码器和比特率
            command.extend(['-c:a', 'aac', '-b:a', '128k'])

            # 添加分辨率设置
            if resolution and resolution != "original":
                if resolution == "1080p":
                    command.extend(['-s', '1920x1080'])
                elif resolution == "720p":
                    command.extend(['-s', '1280x720'])
                elif resolution == "480p":
                    command.extend(['-s', '854x480'])

            # 添加输出文件
            command.extend(['-y', output_path])

            logger.info(f"FFmpeg 命令: {' '.join(command)}")

            # 执行转换
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                error_message = stderr.decode()
                logger.error(f"FFmpeg 错误: {error_message}")
                raise HTTPException(status_code=500, detail=f"视频转换失败: {error_message}")

            logger.info("视频转换完成")

            # 检查输出文件是否存在
            if not os.path.exists(output_path):
                raise HTTPException(status_code=500, detail="视频转换失败：输出文件未生成")

            # 添加后台任务来清理文件
            background_tasks.add_task(cleanup_files, input_path, output_path)

            # 返回转换后的视频
            return FileResponse(
                output_path,
                media_type=SUPPORTED_FORMATS[output_format],
                filename=f"converted.{output_format}"
            )

        except subprocess.CalledProcessError as e:
            error_message = e.stderr.decode() if e.stderr else str(e)
            logger.error(f"FFmpeg 错误: {error_message}")
            raise HTTPException(status_code=500, detail=f"视频转换失败: {error_message}")

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        # 如果出错，立即清理文件
        cleanup_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/video/formats")
async def get_supported_formats():
    """获取支持的视频格式列表"""
    return {
        "formats": [
            {"id": "mp4", "name": "MP4", "description": "最常用的视频格式"},
            {"id": "avi", "name": "AVI", "description": "音频视频交错格式"},
            {"id": "mov", "name": "MOV", "description": "QuickTime视频格式"},
            {"id": "wmv", "name": "WMV", "description": "Windows媒体视频格式"},
            {"id": "flv", "name": "FLV", "description": "Flash视频格式"}
        ]
    } 