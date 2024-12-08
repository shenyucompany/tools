document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const rotateBtn = document.getElementById('rotateBtn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');
    const rotateButtons = document.querySelectorAll('.rotate-button[data-angle]');

    let selectedAngle = null;

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

    // 处理旋转角度选择
    rotateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const angle = this.dataset.angle;
            selectedAngle = angle;
            updateRotateButtons(angle);
            rotateBtn.disabled = false;
        });
    });

    function updateRotateButtons(angle) {
        rotateButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.angle === angle);
        });
    }

    // 处理视频旋转
    rotateBtn.addEventListener('click', rotateVideo);

    async function rotateVideo() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        if (!selectedAngle) {
            alert('请选择旋转角度');
            return;
        }

        progressSection.style.display = 'block';
        rotateBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('angle', selectedAngle);

            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('http://localhost:8000/api/video/rotate', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '旋转视频失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rotated_${selectedAngle}_${file.name}`;

            updateProgress(100);
            completeRotate();

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('旋转失败:', error);
            alert(error.message || '旋转视频失败，请重试');
            resetRotate();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeRotate() {
        statusText.textContent = '旋转完成！';
        setTimeout(() => {
            alert('视频旋转完成，即将开始下载...');
            resetRotate();
        }, 1000);
    }

    function resetRotate() {
        settingsSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        rotateBtn.disabled = true;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在处理中...';
        videoPreview.src = '';
        fileInput.value = '';
        selectedAngle = null;
        updateRotateButtons(null);
    }
}); 