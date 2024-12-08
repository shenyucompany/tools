document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const extractBtn = document.getElementById('extractBtn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');

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

    // 处理音频提取
    const extractType = document.getElementById('extractType');
    const audioSettings = document.getElementById('audioSettings');
    const frameSettings = document.getElementById('frameSettings');

    extractType.addEventListener('change', function() {
        if (this.value === 'audio') {
            audioSettings.style.display = 'block';
            frameSettings.style.display = 'none';
            extractBtn.textContent = '提取音频';
        } else {
            audioSettings.style.display = 'none';
            frameSettings.style.display = 'block';
            extractBtn.textContent = '提取帧';
        }
    });

    extractBtn.addEventListener('click', extractAudio);

    async function extractAudio() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        const type = extractType.value;
        let endpoint = '';
        const formData = new FormData();
        formData.append('video', file);

        if (type === 'audio') {
            endpoint = 'extract';
            const format = document.getElementById('format').value;
            const quality = document.getElementById('quality').value;
            formData.append('format', format);
            formData.append('quality', quality);
        } else {
            endpoint = 'extract-frames';
            const frameRate = document.getElementById('frameRate').value;
            const imageFormat = document.getElementById('imageFormat').value;
            formData.append('frame_rate', frameRate);
            formData.append('image_format', imageFormat);
        }

        progressSection.style.display = 'block';
        extractBtn.disabled = true;

        try {
            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch(`http://localhost:8000/api/video/${endpoint}`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '提取失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = type === 'audio' ? 
                `extracted_audio.${format}` : 
                `frames_${new Date().getTime()}.zip`;

            updateProgress(100);
            completeExtract();

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('提取失败:', error);
            alert(error.message || '提取失败，请重试');
            resetExtract();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeExtract() {
        statusText.textContent = '提取完成！';
        setTimeout(() => {
            alert('提取完成，即将开始下载...');
            resetExtract();
        }, 1000);
    }

    function resetExtract() {
        settingsSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        extractBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在处理中...';
        videoPreview.src = '';
        fileInput.value = '';
    }
}); 