document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const recordBtn = document.getElementById('record-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const stopBtn = document.getElementById('stop-btn');
    const timer = document.querySelector('.timer');
    const levelBar = document.querySelector('.level-bar');
    const formatSelect = document.getElementById('format-select');
    const recordingsList = document.getElementById('recordings');
    const editorSection = document.querySelector('.editor-section');
    const waveform = document.getElementById('waveform');
    const currentTime = document.getElementById('current-time');
    const duration = document.getElementById('duration');

    // 录音相关变量
    let mediaRecorder;
    let audioChunks = [];
    let startTime;
    let timerInterval;
    let audioContext;
    let analyser;
    let dataArray;
    let animationFrame;
    let isPaused = false;
    let wavesurfer = null;

    // 初始化音频上下文
    async function initAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    // 更新音量表
    function updateLevelMeter() {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.min(100, (average / 256) * 100);
        levelBar.style.width = `${level}%`;
        animationFrame = requestAnimationFrame(updateLevelMeter);
    }

    // 更新计时器
    function updateTimer() {
        const elapsed = Date.now() - startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timer.textContent = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    // 开始录音
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            // 连接音频分析器
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await saveRecording(audioBlob);
            };

            mediaRecorder.start(1000);
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
            updateLevelMeter();

            // 更新UI
            recordBtn.hidden = true;
            pauseBtn.hidden = false;
            stopBtn.hidden = false;
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('无法访问麦克风，请确保已授予权限。');
        }
    }

    // 暂停录音
    function pauseRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            isPaused = true;
            clearInterval(timerInterval);
            cancelAnimationFrame(animationFrame);

            // 更新UI
            pauseBtn.hidden = true;
            resumeBtn.hidden = false;
        }
    }

    // 继续录音
    function resumeRecording() {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            isPaused = false;
            timerInterval = setInterval(updateTimer, 1000);
            updateLevelMeter();

            // 更新UI
            resumeBtn.hidden = true;
            pauseBtn.hidden = false;
        }
    }

    // 停止录音
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(timerInterval);
            cancelAnimationFrame(animationFrame);
            levelBar.style.width = '0%';

            // 更新UI
            recordBtn.hidden = false;
            pauseBtn.hidden = true;
            resumeBtn.hidden = true;
            stopBtn.hidden = true;
            timer.textContent = '00:00';
        }
    }

    // 保存录音
    async function saveRecording(audioBlob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const format = formatSelect.value;
        const name = `recording_${timestamp}`;

        try {
            // 转换为Base64
            const base64data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });

            const formData = new FormData();
            formData.append('audio_data', base64data);
            formData.append('format', format);
            formData.append('name', name);

            const response = await fetch('http://localhost:8000/api/audio/record/save', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '保存录音失败');
            }

            const blob = await response.blob();
            addRecordingToList(name, blob, format);
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('保存录音失败：' + error.message);
        }
    }

    // 添加录音到列表
    function addRecordingToList(name, blob, format) {
        const url = URL.createObjectURL(blob);
        const duration = '00:00'; // TODO: 获取实际时长

        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.innerHTML = `
            <div class="recording-info">
                <div class="recording-name">${name}</div>
                <div class="recording-duration">${duration}</div>
            </div>
            <div class="recording-actions">
                <button class="action-btn play" title="播放">
                    <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
                <button class="action-btn edit" title="编辑">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="action-btn download" title="下载">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                </button>
            </div>
        `;

        // 添加事件监听器
        const playBtn = recordingItem.querySelector('.play');
        const editBtn = recordingItem.querySelector('.edit');
        const downloadBtn = recordingItem.querySelector('.download');

        playBtn.onclick = () => {
            const audio = new Audio(url);
            audio.play();
        };

        editBtn.onclick = () => {
            initEditor(blob);
        };

        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        recordingsList.appendChild(recordingItem);
    }

    // 初始化编辑器
    function initEditor(blob) {
        editorSection.hidden = false;

        // 初始化波形图
        if (wavesurfer) {
            wavesurfer.destroy();
        }

        wavesurfer = WaveSurfer.create({
            container: waveform,
            waveColor: '#A8DBA8',
            progressColor: '#4CAF50',
            cursorColor: '#0066ff',
            height: 128,
            normalize: true,
            minimap: true
        });

        wavesurfer.loadBlob(blob);

        wavesurfer.on('ready', () => {
            duration.textContent = formatTime(wavesurfer.getDuration());
        });

        wavesurfer.on('audioprocess', () => {
            currentTime.textContent = formatTime(wavesurfer.getCurrentTime());
        });

        // 编辑按钮事件
        document.getElementById('trim-btn').onclick = () => {
            // TODO: 实现裁剪功能
        };

        document.getElementById('effects-btn').onclick = () => {
            // TODO: 实现效果功能
        };

        document.getElementById('convert-btn').onclick = () => {
            // TODO: 实现格式转换功能
        };
    }

    // 格式化时间
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 事件监听器
    recordBtn.addEventListener('click', () => {
        if (!audioContext) {
            initAudioContext();
        }
        startRecording();
    });

    pauseBtn.addEventListener('click', pauseRecording);
    resumeBtn.addEventListener('click', resumeRecording);
    stopBtn.addEventListener('click', stopRecording);
}); 