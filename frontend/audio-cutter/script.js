document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const editorSection = document.querySelector('.editor-section');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const cutBtn = document.getElementById('cut-btn');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const currentTimeSpan = document.getElementById('current-time');
    const durationSpan = document.getElementById('duration');
    const progress = document.getElementById('progress');

    let wavesurfer = null;
    let audioFile = null;

    // 初始化WaveSurfer
    function initWaveSurfer() {
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#A8DBA8',
            progressColor: '#4CAF50',
            cursorColor: '#0066ff',
            height: 128,
            normalize: true,
            minimap: true,
            backend: 'WebAudio'
        });

        // 音频加载完成后的处理
        wavesurfer.on('ready', function() {
            editorSection.hidden = false;
            const duration = wavesurfer.getDuration();
            durationSpan.textContent = formatTime(duration);
            endTimeInput.value = formatTime(duration, true);
            cutBtn.disabled = false;
        });

        // 播放时更新当前时间
        wavesurfer.on('audioprocess', function() {
            currentTimeSpan.textContent = formatTime(wavesurfer.getCurrentTime());
            // 更新时间选择器的值
            startTimeInput.value = formatTime(wavesurfer.getCurrentTime(), true);
        });

        // 区域选择处理
        wavesurfer.on('region-created', function(region) {
            startTimeInput.value = formatTime(region.start, true);
            endTimeInput.value = formatTime(region.end, true);
        });

        wavesurfer.on('region-update-end', function(region) {
            startTimeInput.value = formatTime(region.start, true);
            endTimeInput.value = formatTime(region.end, true);
        });

        // 播放/暂停状态改变时的处理
        wavesurfer.on('play', () => {
            playBtn.hidden = true;
            pauseBtn.hidden = false;
        });

        wavesurfer.on('pause', () => {
            playBtn.hidden = false;
            pauseBtn.hidden = true;
        });
    }

    // 文件选择处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            displayFile(file);
            audioFile = file;
            if (wavesurfer === null) {
                initWaveSurfer();
            }
            wavesurfer.loadBlob(file);
        }
    });

    // 显示文件信息
    function displayFile(file) {
        const fileSize = formatFileSize(file.size);
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        `;
    }

    // 播放控制
    playBtn.addEventListener('click', () => wavesurfer.play());
    pauseBtn.addEventListener('click', () => wavesurfer.pause());

    // 剪切处理
    cutBtn.addEventListener('click', async () => {
        if (!audioFile) return;

        const startTime = parseTimeToSeconds(startTimeInput.value);
        const endTime = parseTimeToSeconds(endTimeInput.value);
        
        if (startTime >= endTime) {
            alert('开始时间必须小于结束时间');
            return;
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('start_time', startTime);
        formData.append('end_time', endTime);

        cutBtn.disabled = true;
        const originalText = cutBtn.textContent;
        cutBtn.textContent = '处理中...';

        try {
            const response = await fetch('http://localhost:8000/api/audio/cut', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cut_${audioFile.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // 显示成功消息
                progress.innerHTML = `
                    <div class="success-message">
                        剪切完成！文件已自动下载。
                    </div>
                `;
            } else {
                const error = await response.json();
                throw new Error(error.detail || '剪切失败');
            }
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = `
                <div class="error-message">
                    剪切失败：${error.message}
                </div>
            `;
        } finally {
            cutBtn.disabled = false;
            cutBtn.textContent = originalText;
        }
    });

    // 辅助函数
    function formatTime(seconds, forInput = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        seconds = Math.floor(seconds % 60);
        
        if (forInput) {
            // 为input[type="time"]格式化，格式为HH:MM:SS
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            // 为显示格式化，格式为MM:SS或HH:MM:SS
            if (hours > 0) {
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    function parseTimeToSeconds(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 添加时间输入框的事件监听
    startTimeInput.addEventListener('change', function() {
        const startTime = parseTimeToSeconds(this.value);
        if (wavesurfer && wavesurfer.regions) {
            const regions = Object.values(wavesurfer.regions.list);
            if (regions.length > 0) {
                regions[0].start = startTime;
                wavesurfer.seekTo(startTime / wavesurfer.getDuration());
            }
        }
    });

    endTimeInput.addEventListener('change', function() {
        const endTime = parseTimeToSeconds(this.value);
        if (wavesurfer && wavesurfer.regions) {
            const regions = Object.values(wavesurfer.regions.list);
            if (regions.length > 0) {
                regions[0].end = endTime;
            }
        }
    });
}); 