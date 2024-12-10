from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydub import AudioSegment
import numpy as np
from scipy import signal
import json
import os
import io

router = APIRouter()

@router.post("/api/audio/effects")
async def apply_effects(
    file: UploadFile = File(...),
    effects: str = Form(...),  # JSON字符串，包含所有效果参数
    format: str = Form(...)
):
    # 创建临时目录
    os.makedirs("temp", exist_ok=True)
    temp_path = None
    output_path = None

    try:
        # 解析效果参数
        effects_config = json.loads(effects)
        
        # 保存上传的文件
        temp_path = f"temp/{file.filename}"
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        # 加载音频
        audio = AudioSegment.from_file(temp_path)
        samples = np.array(audio.get_array_of_samples())
        sample_rate = audio.frame_rate
        channels = audio.channels

        # 应用效果
        for effect in effects_config:
            effect_type = effect['type']
            params = effect['params']

            if effect_type == 'reverb':
                # 混响效果
                room_size = float(params.get('roomSize', 0.5))  # 0.0 - 1.0
                damping = float(params.get('damping', 0.5))    # 0.0 - 1.0
                
                # 创建混响脉冲响应
                reverb_time = int(room_size * sample_rate)
                decay = np.exp(-damping * np.arange(reverb_time))
                impulse = np.random.randn(reverb_time) * decay
                
                # 应用卷积
                if channels == 2:
                    left = signal.convolve(samples[::2], impulse)[:len(samples[::2])]
                    right = signal.convolve(samples[1::2], impulse)[:len(samples[1::2])]
                    samples = np.column_stack((left, right)).flatten()
                else:
                    samples = signal.convolve(samples, impulse)[:len(samples)]

            elif effect_type == 'stereo':
                # 立体声转换
                mode = params.get('mode', 'stereo')
                if mode == 'mono' and channels == 2:
                    # 转换为单声道
                    samples = np.mean([samples[::2], samples[1::2]], axis=0)
                    channels = 1
                elif mode == 'stereo' and channels == 1:
                    # 转换为立体声
                    samples = np.repeat(samples, 2)
                    channels = 2

            elif effect_type == 'echo':
                # 回声效果
                delay = int(params.get('delay', 0.3) * sample_rate)  # 延迟时间(秒)
                decay = float(params.get('decay', 0.5))              # 衰减系数
                
                # 创建延迟信号
                echo = np.zeros_like(samples)
                echo[delay:] = samples[:-delay] * decay
                samples = samples + echo

            elif effect_type == 'distortion':
                # 失真效果
                gain = float(params.get('gain', 2.0))       # 增益
                threshold = float(params.get('threshold', 0.5))  # 阈值
                
                # 应用失真
                samples = np.clip(samples * gain, -32768 * threshold, 32767 * threshold)

            elif effect_type == 'filter':
                # 滤波器
                filter_type = params.get('type', 'lowpass')
                cutoff = float(params.get('cutoff', 1000))  # 截止频率
                order = int(params.get('order', 4))         # 滤波器阶数
                
                # 设计滤波器
                nyquist = sample_rate / 2
                normalized_cutoff = cutoff / nyquist
                b, a = signal.butter(order, normalized_cutoff, filter_type)
                
                # 应用滤波器
                if channels == 2:
                    left = signal.filtfilt(b, a, samples[::2])
                    right = signal.filtfilt(b, a, samples[1::2])
                    samples = np.column_stack((left, right)).flatten()
                else:
                    samples = signal.filtfilt(b, a, samples)

        # 将处理后的样本转换回音频
        output_path = f"temp/processed_{file.filename}"
        samples = np.int16(np.clip(samples, -32768, 32767))
        
        # 创建新的音频段
        if channels == 2:
            new_audio = AudioSegment(
                samples.tobytes(), 
                frame_rate=sample_rate,
                sample_width=2,
                channels=2
            )
        else:
            new_audio = AudioSegment(
                samples.tobytes(), 
                frame_rate=sample_rate,
                sample_width=2,
                channels=1
            )

        # 导出处理后的音频
        new_audio.export(output_path, format=format)

        # 读取处理后的文件
        with open(output_path, "rb") as f:
            processed_file = f.read()

        # 设置响应头
        content_types = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "m4a": "audio/mp4",
            "flac": "audio/flac"
        }

        return Response(
            content=processed_file,
            media_type=content_types.get(format, "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="processed_{file.filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying effects: {str(e)}")

    finally:
        # 清理临时文件
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        if output_path and os.path.exists(output_path):
            os.remove(output_path) 