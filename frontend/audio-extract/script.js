document.addEventListener('DOMContentLoaded', function() {
    // 视频提取音频部分
    const videoInput = document.getElementById('video-input');
    const audioFormat = document.getElementById('audio-format');
    const extractBtn = document.getElementById('extract-btn');

    // 语音转文字部分
    const speechInput = document.getElementById('speech-input');
    const speechLanguage = document.getElementById('speech-language');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const transcriptionResult = document.getElementById('transcription-result');
    const copyTextBtn = document.getElementById('copy-text-btn');

    // 文字转语音部分
    const textInput = document.getElementById('text-input');
    const ttsLanguage = document.getElementById('tts-language');
    const speechSpeed = document.getElementById('speech-speed');
    const speedValue = document.getElementById('speed-value');
    const synthesizeBtn = document.getElementById('synthesize-btn');
    const audioPreview = document.querySelector('.audio-preview');
    const audioPlayer = document.getElementById('audio-player');
    const downloadAudioBtn = document.getElementById('download-audio-btn');

    // 添加文件预览区域
    const videoPreviewArea = document.createElement('div');
    videoPreviewArea.className = 'file-preview';
    videoPreviewArea.innerHTML = `
        <div class="preview-content">
            <div class="file-info"></div>
            <video controls hidden></video>
        </div>
    `;
    videoInput.parentElement.parentElement.appendChild(videoPreviewArea);

    const audioPreviewArea = document.createElement('div');
    audioPreviewArea.className = 'file-preview';
    audioPreviewArea.innerHTML = `
        <div class="preview-content">
            <div class="file-info"></div>
            <audio controls hidden></audio>
        </div>
    `;
    speechInput.parentElement.parentElement.appendChild(audioPreviewArea);

    // 视频文件处理
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            extractBtn.disabled = false;
            
            // 显示文件信息
            const fileInfo = videoPreviewArea.querySelector('.file-info');
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            `;
            
            // 预览视频
            const video = videoPreviewArea.querySelector('video');
            video.src = URL.createObjectURL(file);
            video.hidden = false;
        }
    });

    // 语音文件处理
    speechInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            transcribeBtn.disabled = false;
            
            // 显示文件信息
            const fileInfo = audioPreviewArea.querySelector('.file-info');
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            `;
            
            // 预览音频
            const audio = audioPreviewArea.querySelector('audio');
            audio.src = URL.createObjectURL(file);
            audio.hidden = false;
        }
    });

    extractBtn.addEventListener('click', async () => {
        const file = videoInput.files[0];
        if (!file) return;

        try {
            extractBtn.disabled = true;
            extractBtn.classList.add('loading');
            extractBtn.textContent = '处理中...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('format', audioFormat.value);

            const response = await fetch('https://tools-as5l.onrender.com/api/audio/extract/from-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '提取失败');
            }

            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : `extracted_audio.${audioFormat.value}`;

            // 下载文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('音频提取成功！');
        } catch (error) {
            console.error('Error extracting audio:', error);
            alert('提取失败：' + error.message);
        } finally {
            extractBtn.disabled = false;
            extractBtn.classList.remove('loading');
            extractBtn.textContent = '提取音频';
            videoInput.value = '';
        }
    });

    transcribeBtn.addEventListener('click', async () => {
        const file = speechInput.files[0];
        if (!file) return;

        try {
            transcribeBtn.disabled = true;
            transcribeBtn.classList.add('loading');
            transcribeBtn.textContent = '转换中...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('language', speechLanguage.value);

            const response = await fetch('https://tools-as5l.onrender.com/api/audio/speech-to-text', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '转换失败');
            }

            const result = await response.json();
            transcriptionResult.value = result.text;
            copyTextBtn.disabled = false;

        } catch (error) {
            console.error('Error transcribing:', error);
            alert('转换失败：' + error.message);
        } finally {
            transcribeBtn.disabled = false;
            transcribeBtn.classList.remove('loading');
            transcribeBtn.textContent = '开始转换';
            speechInput.value = '';
        }
    });

    // 复制文本
    copyTextBtn.addEventListener('click', () => {
        transcriptionResult.select();
        document.execCommand('copy');
        alert('文本已复制到剪贴板！');
    });

    // 语速控制
    speechSpeed.addEventListener('input', (e) => {
        speedValue.textContent = `${e.target.value}x`;
    });

    // 文字转语音
    synthesizeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            alert('请输入要转换的文字！');
            return;
        }

        try {
            synthesizeBtn.disabled = true;
            synthesizeBtn.classList.add('loading');
            synthesizeBtn.textContent = '生成中...';

            const formData = new FormData();
            formData.append('text', text);
            formData.append('language', ttsLanguage.value);
            formData.append('speed', speechSpeed.value);

            const response = await fetch('https://tools-as5l.onrender.com/api/audio/text-to-speech', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '生成失败');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            audioPlayer.src = url;
            audioPreview.hidden = false;

            // 设置下载按钮
            downloadAudioBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'synthesized_speech.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

        } catch (error) {
            console.error('Error synthesizing:', error);
            alert('生成失败：' + error.message);
        } finally {
            synthesizeBtn.disabled = false;
            synthesizeBtn.classList.remove('loading');
            synthesizeBtn.textContent = '生成语音';
        }
    });

    // 辅助函数：格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 