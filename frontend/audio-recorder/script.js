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

            const response = await fetch('https://tools-as5l.onrender.com/api/audio/record/save', {
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
    async function addRecordingToList(name, blob, format) {
        const url = URL.createObjectURL(blob);
        
        // 获取音频时长
        const duration = await getAudioDuration(blob);
        const durationStr = formatTime(duration);

        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        recordingItem.innerHTML = `
            <div class="recording-info">
                <div class="recording-name">${name}</div>
                <div class="recording-duration">${durationStr}</div>
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

    // 获取音频时长
    function getAudioDuration(blob) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(blob);
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(audio.src);
                resolve(audio.duration);
            });
        });
    }

    // 初始化编辑器
    function initEditor(blob) {
        editorSection.hidden = false;

        if (wavesurfer) {
            wavesurfer.destroy();
        }

        // 创建 WaveSurfer 实例
        wavesurfer = WaveSurfer.create({
            container: waveform,
            waveColor: '#A8DBA8',
            progressColor: '#4CAF50',
            cursorColor: '#0066ff',
            height: 128,
            normalize: true,
            plugins: [
                WaveSurfer.regions.create({
                    dragSelection: {
                        slop: 5
                    },
                    color: 'rgba(0, 102, 255, 0.1)'
                })
            ]
        });

        wavesurfer.loadBlob(blob);

        // 添加播放控制
        let isPlaying = false;
        waveform.addEventListener('click', () => {
            if (isPlaying) {
                wavesurfer.pause();
            } else {
                wavesurfer.play();
            }
            isPlaying = !isPlaying;
        });

        wavesurfer.on('ready', () => {
            duration.textContent = formatTime(wavesurfer.getDuration());
            // 创建默认选区
            wavesurfer.regions.add({
                id: 'default-region',
                start: 0,
                end: wavesurfer.getDuration(),
                color: 'rgba(0, 102, 255, 0.1)',
                drag: true,
                resize: true
            });
        });

        wavesurfer.on('audioprocess', () => {
            currentTime.textContent = formatTime(wavesurfer.getCurrentTime());
        });

        // 裁剪功能
        document.getElementById('trim-btn').onclick = async () => {
            const region = wavesurfer.regions.list['default-region'];
            if (!region) {
                alert('请先选择要裁剪的区域');
                return;
            }

            try {
                // 创建新的 AudioContext
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 解码音频数据
                const audioData = await blob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(audioData);
                
                // 计算裁剪位置
                const startSample = Math.floor(region.start * audioBuffer.sampleRate);
                const endSample = Math.floor(region.end * audioBuffer.sampleRate);
                const duration = endSample - startSample;
                
                // 创建新的 AudioBuffer
                const newBuffer = audioContext.createBuffer(
                    audioBuffer.numberOfChannels,
                    duration,
                    audioBuffer.sampleRate
                );
                
                // 复制选中区域的数据
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    const newChannelData = newBuffer.getChannelData(channel);
                    for (let i = 0; i < duration; i++) {
                        newChannelData[i] = channelData[startSample + i];
                    }
                }
                
                // 将 AudioBuffer 转换为 Blob
                const offlineContext = new OfflineAudioContext(
                    audioBuffer.numberOfChannels,
                    duration,
                    audioBuffer.sampleRate
                );
                const source = offlineContext.createBufferSource();
                source.buffer = newBuffer;
                source.connect(offlineContext.destination);
                source.start();
                
                const renderedBuffer = await offlineContext.startRendering();
                const wavBlob = await audioBufferToWav(renderedBuffer);
                
                // 更新波形显示
                wavesurfer.loadBlob(wavBlob);
                
                alert('裁剪成功！');
            } catch (error) {
                console.error('Error trimming:', error);
                alert('裁剪失败：' + error.message);
            }
        };

        // 效果功能
        document.getElementById('effects-btn').onclick = () => {
            // 创建效果选择对话框
            const dialog = document.createElement('div');
            dialog.className = 'effects-dialog';
            dialog.innerHTML = `
                <div class="effects-content">
                    <h3>音频效果</h3>
                    <div class="effects-tabs">
                        <button class="tab-btn active" data-tab="reverb">混响</button>
                        <button class="tab-btn" data-tab="stereo">声道转换</button>
                        <button class="tab-btn" data-tab="echo">回声</button>
                        <button class="tab-btn" data-tab="distortion">失真</button>
                        <button class="tab-btn" data-tab="filter">滤波器</button>
                    </div>
                    <div class="effects-panels">
                        <div class="panel active" id="reverb-panel">
                            <div class="effect-group">
                                <label>房间大小</label>
                                <input type="range" id="room-size" min="0" max="1" value="0.5" step="0.1">
                                <span>0.5</span>
                            </div>
                            <div class="effect-group">
                                <label>衰减系数</label>
                                <input type="range" id="damping" min="0" max="1" value="0.5" step="0.1">
                                <span>0.5</span>
                            </div>
                        </div>
                        <div class="panel" id="stereo-panel">
                            <div class="effect-group">
                                <label>声道模式</label>
                                <select id="stereo-mode">
                                    <option value="stereo">立体声</option>
                                    <option value="mono">单声道</option>
                                </select>
                            </div>
                        </div>
                        <div class="panel" id="echo-panel">
                            <div class="effect-group">
                                <label>延迟时间 (秒)</label>
                                <input type="range" id="echo-delay" min="0.1" max="2" value="0.3" step="0.1">
                                <span>0.3s</span>
                            </div>
                            <div class="effect-group">
                                <label>衰减系数</label>
                                <input type="range" id="echo-decay" min="0" max="1" value="0.5" step="0.1">
                                <span>0.5</span>
                            </div>
                        </div>
                        <div class="panel" id="distortion-panel">
                            <div class="effect-group">
                                <label>增益</label>
                                <input type="range" id="distortion-gain" min="1" max="10" value="2" step="0.5">
                                <span>2.0</span>
                            </div>
                            <div class="effect-group">
                                <label>阈值</label>
                                <input type="range" id="distortion-threshold" min="0.1" max="1" value="0.5" step="0.1">
                                <span>0.5</span>
                            </div>
                        </div>
                        <div class="panel" id="filter-panel">
                            <div class="effect-group">
                                <label>滤波器类型</label>
                                <select id="filter-type">
                                    <option value="lowpass">低通滤波器</option>
                                    <option value="highpass">高通滤波器</option>
                                    <option value="bandpass">带通滤波器</option>
                                </select>
                            </div>
                            <div class="effect-group">
                                <label>截止频率 (Hz)</label>
                                <input type="range" id="filter-cutoff" min="20" max="20000" value="1000" step="10">
                                <span>1000 Hz</span>
                            </div>
                            <div class="effect-group">
                                <label>滤波器阶数</label>
                                <select id="filter-order">
                                    <option value="2">2阶</option>
                                    <option value="4" selected>4阶</option>
                                    <option value="6">6阶</option>
                                    <option value="8">8阶</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="preview-section">
                        <button id="preview-btn" class="preview-btn">预览效果</button>
                        <div class="preview-waveform" id="preview-waveform"></div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="cancel-btn">取消</button>
                        <button class="apply-btn">应用</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // 添加标签切换功能
            const tabs = dialog.querySelectorAll('.tab-btn');
            const panels = dialog.querySelectorAll('.panel');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));
                    tab.classList.add('active');
                    dialog.querySelector(`#${tab.dataset.tab}-panel`).classList.add('active');
                });
            });

            // 更新滑块值显示
            dialog.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    e.target.nextElementSibling.textContent = 
                        e.target.id === 'filter-cutoff' ? `${value} Hz` :
                        e.target.id === 'echo-delay' ? `${value}s` :
                        e.target.id === 'distortion-gain' ? `${value}.0` :
                        value;
                });
            });

            // 预览功能
            let previewWavesurfer = null;
            const previewBtn = dialog.querySelector('#preview-btn');
            previewBtn.addEventListener('click', async () => {
                try {
                    previewBtn.disabled = true;
                    previewBtn.textContent = '处理中...';

                    const effects = getCurrentEffects(dialog);
                    const processedBlob = await applyAudioEffects(blob, effects);

                    if (previewWavesurfer) {
                        previewWavesurfer.destroy();
                    }

                    previewWavesurfer = WaveSurfer.create({
                        container: dialog.querySelector('#preview-waveform'),
                        waveColor: '#A8DBA8',
                        progressColor: '#4CAF50',
                        height: 50,
                        normalize: true
                    });

                    previewWavesurfer.loadBlob(processedBlob);
                } catch (error) {
                    console.error('Preview error:', error);
                    alert('预览失败：' + error.message);
                } finally {
                    previewBtn.disabled = false;
                    previewBtn.textContent = '预览效果';
                }
            });

            // 取消按钮
            dialog.querySelector('.cancel-btn').onclick = () => {
                if (previewWavesurfer) {
                    previewWavesurfer.destroy();
                }
                document.body.removeChild(dialog);
            };

            // 应用按钮
            dialog.querySelector('.apply-btn').onclick = async () => {
                try {
                    const effects = getCurrentEffects(dialog);
                    const processedBlob = await applyAudioEffects(blob, effects);
                    wavesurfer.loadBlob(processedBlob);
                    document.body.removeChild(dialog);
                } catch (error) {
                    console.error('Error applying effects:', error);
                    alert('应用效果失败：' + error.message);
                }
            };
        };

        // 格式转换功能
        document.getElementById('convert-btn').onclick = () => {
            // 创建格式选择对话框
            const dialog = document.createElement('div');
            dialog.className = 'format-dialog';
            dialog.innerHTML = `
                <div class="format-content">
                    <h3>选择输出格式</h3>
                    <select id="output-format">
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="ogg">OGG</option>
                    </select>
                    <div class="dialog-buttons">
                        <button class="cancel-btn">取消</button>
                        <button class="convert-btn">转换</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.cancel-btn').onclick = () => {
                document.body.removeChild(dialog);
            };

            dialog.querySelector('.convert-btn').onclick = async () => {
                const format = dialog.querySelector('#output-format').value;
                const formData = new FormData();
                formData.append('file', new File([blob], 'audio.wav'));
                formData.append('format', format);

                try {
                    const response = await fetch('https://tools-as5l.onrender.com/api/audio/record/edit', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.detail || '格式转换失败');
                    }

                    const newBlob = await response.blob();
                    const url = URL.createObjectURL(newBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted_audio.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    document.body.removeChild(dialog);
                    alert('格式转换成功！');
                } catch (error) {
                    console.error('Error converting format:', error);
                    alert('格式转换失败：' + error.message);
                }
            };
        };
    }

    // 格式化时间
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 添加 AudioBuffer 转 WAV 的辅助函数
    function audioBufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2;
        const outputBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(outputBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // 写入WAV文件头
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, buffer.sampleRate, true);
        view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, length, true);

        // 写入采样数据
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        offset = 44;
        while (pos < buffer.length) {
            for (let i = 0; i < numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][pos]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([outputBuffer], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // 获取当前效果配置
    function getCurrentEffects(dialog) {
        const activePanel = dialog.querySelector('.panel.active');
        const effectType = activePanel.id.replace('-panel', '');
        const effects = [];

        switch (effectType) {
            case 'reverb':
                effects.push({
                    type: 'reverb',
                    params: {
                        roomSize: parseFloat(dialog.querySelector('#room-size').value),
                        damping: parseFloat(dialog.querySelector('#damping').value)
                    }
                });
                break;
            case 'stereo':
                effects.push({
                    type: 'stereo',
                    params: {
                        mode: dialog.querySelector('#stereo-mode').value
                    }
                });
                break;
            case 'echo':
                effects.push({
                    type: 'echo',
                    params: {
                        delay: parseFloat(dialog.querySelector('#echo-delay').value),
                        decay: parseFloat(dialog.querySelector('#echo-decay').value)
                    }
                });
                break;
            case 'distortion':
                effects.push({
                    type: 'distortion',
                    params: {
                        gain: parseFloat(dialog.querySelector('#distortion-gain').value),
                        threshold: parseFloat(dialog.querySelector('#distortion-threshold').value)
                    }
                });
                break;
            case 'filter':
                effects.push({
                    type: 'filter',
                    params: {
                        type: dialog.querySelector('#filter-type').value,
                        cutoff: parseFloat(dialog.querySelector('#filter-cutoff').value),
                        order: parseInt(dialog.querySelector('#filter-order').value)
                    }
                });
                break;
        }

        return effects;
    }

    // 应用音频效果
    async function applyAudioEffects(blob, effects) {
        const formData = new FormData();
        formData.append('file', new File([blob], 'audio.wav'));
        formData.append('effects', JSON.stringify(effects));
        formData.append('format', 'wav');

        try {
            const response = await fetch('https://tools-as5l.onrender.com/api/audio/effects', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '处理失败');
            }

            return await response.blob();
        } catch (error) {
            console.error('Error applying effects:', error);
            throw error;
        }
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