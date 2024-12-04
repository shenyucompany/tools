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

    function startConversion() {
        // 显示进度条
        progressSection.style.display = 'block';
        convertBtn.disabled = true;

        // 模拟转换进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            updateProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);
                completeConversion();
            }
        }, 50);
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