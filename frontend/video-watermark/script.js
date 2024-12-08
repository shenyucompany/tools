document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const watermarkBtn = document.getElementById('addWatermarkBtn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');
    const opacityInput = document.getElementById('opacity');
    const opacityValue = document.querySelector('.opacity-value');

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

    // 处理透明度滑块
    opacityInput.addEventListener('input', function() {
        opacityValue.textContent = this.value + '%';
    });

    // 处理水印添加
    watermarkBtn.addEventListener('click', addWatermark);

    async function addWatermark() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        const watermarkText = document.getElementById('watermarkText').value;
        if (!watermarkText) {
            alert('请输入水印文字');
            return;
        }

        const fontSize = document.getElementById('fontSize').value;
        const position = document.getElementById('position').value;
        const opacity = opacityInput.value;

        progressSection.style.display = 'block';
        watermarkBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('text', watermarkText);
            formData.append('font_size', fontSize);
            formData.append('position', position);
            formData.append('opacity', opacity);

            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('http://localhost:8000/api/video/watermark', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '添加水印失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `watermarked_${file.name}`;

            updateProgress(100);
            completeWatermark();

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('添加水印失败:', error);
            alert(error.message || '添加水印失败，请重试');
            resetWatermark();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeWatermark() {
        statusText.textContent = '水印添加完成！';
        setTimeout(() => {
            alert('水印添加完��，即将开始下载...');
            resetWatermark();
        }, 1000);
    }

    function resetWatermark() {
        settingsSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        watermarkBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在处理中...';
        videoPreview.src = '';
        fileInput.value = '';
        document.getElementById('watermarkText').value = '';
    }
}); 