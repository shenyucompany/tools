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

def cleanup_files(input_path: str, output_path: str):
    """清理临时文件"""
    try:
        if input_path and os.path.exists(input_path):
            os.remove(input_path)
            logger.info(f"已删除输入文件: {input_path}")
        if output_path and os.path.exists(output_path):
            os.remove(output_path)
            logger.info(f"已删除输出文件: {output_path}")
    except Exception as e:
        logger.error(f"清理临时文件时出错: {str(e)}")

@router.post("/api/video/trim")
async def trim_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    start_time: float = Form(default=0),
    end_time: float = Form(default=0)
):
    input_path = None
    output_path = None

    try:
        logger.info(f"开始处理视频剪切请求: start_time={start_time}, end_time={end_time}")
        logger.info(f"上传文件类型: {video.content_type}")
        logger.info(f"上传文件名: {video.filename}")
        logger.info(f"文件大小: {len(await video.read())} bytes")
        # 重置文件指针
        await video.seek(0)

        # 验证文件格式
        if not video.content_type.startswith('video/'):
            logger.error(f"无效的文件类型: {video.content_type}")
            raise HTTPException(status_code=400, detail="请上传视频文件")

        # 验证时间参数
        if start_time < 0:
            logger.error(f"无效的开始时间: {start_time}")
            raise HTTPException(status_code=400, detail="无效的时间范围")

        if end_time <= 0:
            logger.error(f"无效的结束时间: {end_time}")
            raise HTTPException(status_code=400, detail="结束时间必须大于0")

        if end_time <= start_time:
            logger.error(f"结束时间小于等于开始时间: end_time={end_time}, start_time={start_time}")
            raise HTTPException(status_code=400, detail="结束时间必须大于开始时间")

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
        logger.info(f"保存的文件大小: {file_size} bytes")
        if file_size > MAX_FILE_SIZE:
            logger.error(f"文件太大: {file_size} bytes > {MAX_FILE_SIZE} bytes")
            raise HTTPException(status_code=400, detail="文件大小超过限制（最大1GB）")

        logger.info("开始视频剪切")

        try:
            # 设置 FFmpeg 命令
            duration = end_time - start_time
            command = [
                'ffmpeg',
                '-ss', str(start_time),
                '-i', input_path,
                '-t', str(duration),
                '-c:v', 'libx264',  # 使用 x264 编码器
                '-preset', 'fast',   # 使用快速编码预设
                '-c:a', 'aac',      # 使用 AAC 音频编码
                '-b:a', '128k',     # 设置音频比特率
                '-movflags', '+faststart',  # 优化视频加载
                '-y',
                output_path
            ]

            logger.info(f"FFmpeg 命令: {' '.join(command)}")

            # 在执行剪切前，先获取视频信息
            probe_command = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                input_path
            ]
            
            try:
                video_duration = float(subprocess.check_output(probe_command).decode().strip())
                logger.info(f"视频总时长: {video_duration} 秒")
                
                if start_time >= video_duration:
                    raise HTTPException(status_code=400, detail="开始时间超出视频时长")
                
                if end_time > video_duration:
                    raise HTTPException(status_code=400, detail="结束时间超出视频时长")
                
                # 检查实际剪切时长
                if duration > (video_duration - start_time):
                    duration = video_duration - start_time
                    logger.warning(f"调整剪切时长为: {duration} 秒")
                    command[command.index('-t') + 1] = str(duration)

            except subprocess.CalledProcessError as e:
                logger.error("获取视频时长失败")
                raise HTTPException(status_code=500, detail="无法获取视频时长")

            # 执行剪切
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                error_message = stderr.decode()
                logger.error(f"FFmpeg 错误: {error_message}")
                raise HTTPException(status_code=500, detail="视频剪切失败，请重试")

            logger.info("视频剪切完成")

            # 检查输出文件是否存在和有效
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise HTTPException(status_code=500, detail="视频剪切失败：输出文件无效")

            # 添加后台任务来清理文件
            background_tasks.add_task(cleanup_files, input_path, output_path)

            # 返回剪切后的视频
            return FileResponse(
                output_path,
                media_type=video.content_type,
                filename=f"trimmed_{video.filename}"
            )

        except subprocess.CalledProcessError as e:
            error_message = e.stderr.decode() if e.stderr else str(e)
            logger.error(f"FFmpeg 错误: {error_message}")
            raise HTTPException(status_code=500, detail="视频剪切失败，请重试")

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}", exc_info=True)
        # 如果出错，立即清理文件
        cleanup_files(input_path, output_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="服务器内部错误，请重试") 