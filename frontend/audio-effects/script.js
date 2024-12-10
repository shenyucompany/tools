document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const editorSection = document.querySelector('.editor-section');
    const waveform = document.getElementById('waveform');
    const currentTime = document.getElementById('current-time');
    const duration = document.getElementById('duration');
    const previewBtn = document.getElementById('preview-btn');
    const applyBtn = document.getElementById('apply-btn');
    const saveBtn = document.getElementById('save-btn');

    // 全局变量
    let wavesurfer = null;
    let currentBlob = null;
    let isPlaying = false;

    // 初始化波形显示
    function initWaveSurfer() {
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
            responsive: true
        });

        // 添加事件监听
        wavesurfer.on('ready', () => {
            duration.textContent = formatTime(wavesurfer.getDuration());
        });

        wavesurfer.on('audioprocess', () => {
            currentTime.textContent = formatTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('finish', () => {
            isPlaying = false;
        });

        // 点击波形播放/暂停
        waveform.addEventListener('click', () => {
            if (isPlaying) {
                wavesurfer.pause();
            } else {
                wavesurfer.play();
            }
            isPlaying = !isPlaying;
        });
    }

    // 添加加载状态显示
    function showLoading(show = true) {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">处理中...</div>
            </div>
        `;

        if (show) {
            document.body.appendChild(loadingEl);
        } else {
            const existing = document.querySelector('.loading-overlay');
            if (existing) {
                existing.remove();
            }
        }
    }

    // 添加文件类型检查
    function validateAudioFile(file) {
        const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
        if (!validTypes.includes(file.type)) {
            throw new Error('不支持的文件格式，请上传WAV、MP3或OGG格式的音频文件');
        }
        
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            throw new Error('文件大小不能超过100MB');
        }
    }

    // 修改文件上传处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            validateAudioFile(file);
            showLoading(true);
            
            currentBlob = file;
            displayFile(file);
            initWaveSurfer();
            await wavesurfer.loadBlob(file);
            editorSection.hidden = false;
        } catch (error) {
            alert(error.message);
            fileInput.value = '';
        } finally {
            showLoading(false);
        }
    });

    // 显示文件信息
    function displayFile(file) {
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
        `;
    }

    // 标签切换功能
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`#${tab.dataset.tab}-panel`).classList.add('active');
        });
    });

    // 更新滑块值显示
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.nextElementSibling.textContent = 
                e.target.id === 'filter-cutoff' ? `${value} Hz` :
                e.target.id === 'echo-delay' ? `${value}s` :
                e.target.id === 'distortion-gain' ? `${value}.0` :
                value;
        });
    });

    // 获取当前效果配置
    function getCurrentEffects() {
        const activePanel = document.querySelector('.panel.active');
        const effectType = activePanel.id.replace('-panel', '');
        const effects = [];

        switch (effectType) {
            case 'reverb':
                effects.push({
                    type: 'reverb',
                    params: {
                        roomSize: parseFloat(document.getElementById('room-size').value),
                        damping: parseFloat(document.getElementById('damping').value)
                    }
                });
                break;
            case 'stereo':
                effects.push({
                    type: 'stereo',
                    params: {
                        mode: document.getElementById('stereo-mode').value
                    }
                });
                break;
            case 'echo':
                effects.push({
                    type: 'echo',
                    params: {
                        delay: parseFloat(document.getElementById('echo-delay').value),
                        decay: parseFloat(document.getElementById('echo-decay').value)
                    }
                });
                break;
            case 'distortion':
                effects.push({
                    type: 'distortion',
                    params: {
                        gain: parseFloat(document.getElementById('distortion-gain').value),
                        threshold: parseFloat(document.getElementById('distortion-threshold').value)
                    }
                });
                break;
            case 'filter':
                effects.push({
                    type: 'filter',
                    params: {
                        type: document.getElementById('filter-type').value,
                        cutoff: parseFloat(document.getElementById('filter-cutoff').value),
                        order: parseInt(document.getElementById('filter-order').value)
                    }
                });
                break;
        }

        return effects;
    }

    // 优化效果应用函数
    async function applyAudioEffects(blob, effects) {
        const formData = new FormData();
        formData.append('file', new File([blob], 'audio.wav'));
        formData.append('effects', JSON.stringify(effects));
        formData.append('format', 'wav');

        try {
            showLoading(true);
            const response = await fetch('http://localhost:8000/api/audio/effects', {
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
        } finally {
            showLoading(false);
        }
    }

    // 预览按钮处理
    previewBtn.addEventListener('click', async () => {
        if (!currentBlob) return;

        try {
            previewBtn.disabled = true;
            previewBtn.textContent = '处理中...';

            const effects = getCurrentEffects();
            const processedBlob = await applyAudioEffects(currentBlob, effects);
            wavesurfer.loadBlob(processedBlob);
        } catch (error) {
            alert('预览失败：' + error.message);
        } finally {
            previewBtn.disabled = false;
            previewBtn.textContent = '预览效果';
        }
    });

    // 应用按钮处理
    applyBtn.addEventListener('click', async () => {
        if (!currentBlob) return;

        try {
            applyBtn.disabled = true;
            applyBtn.textContent = '处理中...';

            const effects = getCurrentEffects();
            const processedBlob = await applyAudioEffects(currentBlob, effects);
            currentBlob = processedBlob;
            wavesurfer.loadBlob(processedBlob);
            alert('效果应用成功！');
        } catch (error) {
            alert('应用失败：' + error.message);
        } finally {
            applyBtn.disabled = false;
            applyBtn.textContent = '应用效果';
        }
    });

    // 保存按钮处理
    saveBtn.addEventListener('click', () => {
        if (!currentBlob) return;

        const url = URL.createObjectURL(currentBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed_audio.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 辅助函数：格式化时间
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 辅助函数：格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 添加播放状态指示
    wavesurfer.on('play', () => {
        isPlaying = true;
        waveform.classList.add('playing');
    });

    wavesurfer.on('pause', () => {
        isPlaying = false;
        waveform.classList.remove('playing');
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && currentBlob) {
            e.preventDefault();
            if (isPlaying) {
                wavesurfer.pause();
            } else {
                wavesurfer.play();
            }
        }
    });
}); 