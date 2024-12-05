document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.querySelector('.settings-section');
    const progressSection = document.querySelector('.progress-section');
    const videoPreview = document.getElementById('videoPreview');
    const trimBtn = document.getElementById('trimBtn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const timelineStart = document.querySelector('.timeline-handle.start');
    const timelineEnd = document.querySelector('.timeline-handle.end');
    const timelineSelection = document.querySelector('.timeline-selection');
    const currentTimeSpan = document.querySelector('.current-time');
    const totalTimeSpan = document.querySelector('.total-time');

    let videoDuration = 0;

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
        videoPreview.onloadedmetadata = function() {
            videoDuration = videoPreview.duration;
            endTimeInput.value = videoDuration.toFixed(1);
            endTimeInput.max = videoDuration;
            startTimeInput.max = videoDuration;
            updateTimeline();
            updateTimeDisplay();
        };
        settingsSection.style.display = 'block';
        dropArea.style.display = 'none';
    }

    // 处理时间轴
    function updateTimeline() {
        const startPercent = (startTimeInput.value / videoDuration) * 100;
        const endPercent = (endTimeInput.value / videoDuration) * 100;
        
        timelineStart.style.left = `${startPercent}%`;
        timelineEnd.style.left = `${endPercent}%`;
        timelineSelection.style.left = `${startPercent}%`;
        timelineSelection.style.width = `${endPercent - startPercent}%`;
    }

    function updateTimeDisplay() {
        currentTimeSpan.textContent = formatTime(startTimeInput.value);
        totalTimeSpan.textContent = formatTime(endTimeInput.value);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 时间输入处理
    startTimeInput.addEventListener('input', function() {
        if (parseFloat(this.value) >= parseFloat(endTimeInput.value)) {
            this.value = parseFloat(endTimeInput.value) - 0.1;
        }
        updateTimeline();
        updateTimeDisplay();
    });

    endTimeInput.addEventListener('input', function() {
        if (parseFloat(this.value) <= parseFloat(startTimeInput.value)) {
            this.value = parseFloat(startTimeInput.value) + 0.1;
        }
        updateTimeline();
        updateTimeDisplay();
    });

    // 处理视频剪切
    trimBtn.addEventListener('click', startTrim);

    async function startTrim() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请先选择视频文件');
            return;
        }

        // 验证时间范围
        const startTime = parseFloat(startTimeInput.value);
        const endTime = parseFloat(endTimeInput.value);
        
        if (startTime >= videoDuration) {
            alert('开始时间不能大于视频时长');
            return;
        }
        
        if (endTime > videoDuration) {
            alert('结束时间不能大于视频时长');
            return;
        }
        
        if (startTime < 0) {
            alert('开始时间不能小于0');
            return;
        }
        
        if (endTime <= 0) {
            alert('结束时间必须大于0');
            return;
        }
        
        if (endTime <= startTime) {
            alert('结束时间必须大于开始时间');
            return;
        }

        // 显示进度条
        progressSection.style.display = 'block';
        trimBtn.disabled = true;
        settingsSection.style.display = 'block';

        try {
            const formData = new FormData();
            formData.append('video', file, file.name);
            formData.append('start_time', startTime.toString());
            formData.append('end_time', endTime.toString());

            // 创建进度更新器
            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('https://tools-as5l.onrender.com/api/video/trim', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('服务器返回错误:', errorData);
                throw new Error(errorData.detail || '视频剪切失败');
            }

            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trimmed_${file.name}`;
            
            // 更新进度到100%并完成剪切
            updateProgress(100);
            completeTrim();
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('剪切失败:', error);
            alert(error.message || '视频剪切失败，请重试');
            resetTrimmer();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeTrim() {
        statusText.textContent = '剪切完成��';
        setTimeout(() => {
            alert('视频剪切完成，即将开始下载...');
            resetTrimmer();
        }, 1000);
    }

    function resetTrimmer() {
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        trimBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在剪切中...';
    }
}); 