document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const convertBtn = document.getElementById('convertBtn');
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
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('video/')) {
                showVideoPreview(file);
            } else {
                alert('请上传视频文件');
            }
        }
    }

    function showVideoPreview(file) {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        settingsSection.style.display = 'block';
        dropArea.style.display = 'none';
    }

    // 处理视频转换
    convertBtn.addEventListener('click', startConversion);

    async function startConversion() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        // 显示进度条
        progressSection.style.display = 'block';
        convertBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('output_format', document.getElementById('formatSelect').value);
            formData.append('quality', document.getElementById('qualitySelect').value);
            formData.append('resolution', document.getElementById('resolutionSelect').value);

            // 创建进度更新器
            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('http://localhost:8000/api/video/convert', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '视频转换失败');
            }

            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted.${document.getElementById('formatSelect').value}`;
            
            // 更新进度到100%并完成转换
            updateProgress(100);
            completeConversion();
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('转换失败:', error);
            alert('视频转换失败，请重试');
            resetConverter();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeConversion() {
        statusText.textContent = '转换完成！';
        setTimeout(() => {
            // 这里应该触发下载
            alert('视频转换完成，即将开始下载...');
            resetConverter();
        }, 1000);
    }

    function resetConverter() {
        settingsSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        convertBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在转换中...';
        videoPreview.src = '';
        fileInput.value = '';
    }
}); 