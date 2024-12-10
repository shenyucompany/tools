from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, StreamingResponse
from moviepy.editor import VideoFileClip
import speech_recognition as sr
from gtts import gTTS
import os
import io
import tempfile
from pydub import AudioSegment

router = APIRouter()

@router.post("/api/audio/extract/from-video")
async def extract_audio(
    file: UploadFile = File(...),
    format: str = Form("mp3")
):
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, "temp_video")
    audio_path = os.path.join(temp_dir, f"extracted_audio.{format}")

    try:
        # 保存上传的视频文件
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 提取音频
        video = VideoFileClip(video_path)
        audio = video.audio
        audio.write_audiofile(audio_path)

        # 读取处理后的音频
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        # 设置正确的Content-Type
        content_types = {
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg"
        }

        return Response(
            content=audio_data,
            media_type=content_types.get(format, "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="extracted_audio.{format}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # 清理临时文件
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        os.rmdir(temp_dir)

@router.post("/api/audio/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("zh-CN")
):
    temp_dir = tempfile.mkdtemp()
    original_audio_path = os.path.join(temp_dir, "original_audio")
    wav_audio_path = os.path.join(temp_dir, "audio.wav")

    try:
        # 保存上传的文件
        with open(original_audio_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 转换为WAV格式（如果需要）
        try:
            audio = AudioSegment.from_file(original_audio_path)
            audio = audio.set_channels(1)  # 转换为单声道
            audio = audio.set_frame_rate(16000)  # 设置采样率
            audio.export(wav_audio_path, format="wav")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"音频格式转换失败: {str(e)}"
            )

        # 初始化识别器
        recognizer = sr.Recognizer()
        
        # 读取音频文件
        with sr.AudioFile(wav_audio_path) as source:
            # 调整噪声水平
            recognizer.adjust_for_ambient_noise(source)
            # 录制音频数据
            audio = recognizer.record(source)

        try:
            # 尝试使用Google Speech Recognition
            text = recognizer.recognize_google(audio, language=language)
            return {"text": text}
        except sr.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"语音识别服务暂时不可用: {str(e)}"
            )
        except sr.UnknownValueError:
            raise HTTPException(
                status_code=400,
                detail="无法识别音频内容，请确保音频质量良好且语言选择正确"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )

    finally:
        # 清理临时文件
        for path in [original_audio_path, wav_audio_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass
        try:
            os.rmdir(temp_dir)
        except:
            pass

@router.post("/api/audio/text-to-speech")
async def text_to_speech(
    text: str = Form(...),
    language: str = Form("zh"),  # 默认中文
    speed: float = Form(1.0)     # 语速
):
    try:
        # 创建gTTS对象
        tts = gTTS(text=text, lang=language, slow=(speed < 1.0))
        
        # 将音频保存到内存中
        audio_io = io.BytesIO()
        tts.write_to_fp(audio_io)
        audio_io.seek(0)

        # 返回音频流
        return StreamingResponse(
            audio_io,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'attachment; filename="synthesized_speech.mp3"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 