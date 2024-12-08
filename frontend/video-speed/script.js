document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const adjustBtn = document.getElementById('adjustBtn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    const speedPresets = document.querySelectorAll('.speed-preset');

    // 处理文件拖放
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('drag-over');
    }

    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }

    // 处理文件上传
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('video/')) {
            alert('请选择视频文件');
            return;
        }

        showVideoPreview(file);
    }

    function showVideoPreview(file) {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        settingsSection.style.display = 'block';
        dropArea.style.display = 'none';
    }

    // 处理速���调整
    speedRange.addEventListener('input', function() {
        speedValue.textContent = this.value;
        updateSpeedPresets(this.value);
    });

    speedPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const speed = this.dataset.speed;
            speedRange.value = speed;
            speedValue.textContent = speed;
            updateSpeedPresets(speed);
        });
    });

    function updateSpeedPresets(speed) {
        speedPresets.forEach(preset => {
            preset.classList.toggle('active', preset.dataset.speed === speed);
        });
    }

    // 处理视频处理
    adjustBtn.addEventListener('click', adjustSpeed);

    async function adjustSpeed() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        const speed = parseFloat(speedRange.value);
        if (speed <= 0 || speed > 4) {
            alert('速度倍率必须在0-4之间');
            return;
        }

        progressSection.style.display = 'block';
        adjustBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('speed', speed);

            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('http://localhost:8000/api/video/speed', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '调整速度失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `speed_${speed}x_${file.name}`;

            updateProgress(100);
            completeAdjust();

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('调整失败:', error);
            alert(error.message || '调整速度失败，请重试');
            resetAdjust();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeAdjust() {
        statusText.textContent = '调整完成！';
        setTimeout(() => {
            alert('速度调整完成，即将开始下载...');
            resetAdjust();
        }, 1000);
    }

    function resetAdjust() {
        settingsSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        adjustBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在处理中...';
        videoPreview.src = '';
        fileInput.value = '';
        speedRange.value = '1';
        speedValue.textContent = '1.0';
        updateSpeedPresets('1');
    }
}); 