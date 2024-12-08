document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const filesSection = document.querySelector('.files-section');
    const filesList = document.getElementById('filesList');
    const mergeBtn = document.getElementById('mergeBtn');
    const progressSection = document.querySelector('.progress-section');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const statusText = document.querySelector('.status-text');

    let files = [];

    // 初始化拖拽排序
    new Sortable(filesList, {
        animation: 150,
        handle: '.file-handle',
        ghostClass: 'sortable-ghost'
    });

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

    function handleFiles(fileList) {
        const validFiles = Array.from(fileList).filter(file => file.type.startsWith('video/'));
        if (validFiles.length === 0) {
            alert('请选择视频文件');
            return;
        }

        files = files.concat(validFiles);
        updateFilesList();
        filesSection.style.display = 'block';
        dropArea.style.display = 'none';
    }

    function updateFilesList() {
        filesList.innerHTML = files.map((file, index) => `
            <div class="file-item" data-index="${index}">
                <div class="file-handle">⋮⋮</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="file-remove" onclick="removeFile(${index})">✕</button>
            </div>
        `).join('');
    }

    window.removeFile = function(index) {
        files.splice(index, 1);
        if (files.length === 0) {
            filesSection.style.display = 'none';
            dropArea.style.display = 'block';
        } else {
            updateFilesList();
        }
    };

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 处理视频合并
    mergeBtn.addEventListener('click', startMerge);

    async function startMerge() {
        if (files.length < 2) {
            alert('请至少选择两个视频文件');
            return;
        }

        progressSection.style.display = 'block';
        mergeBtn.disabled = true;

        try {
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('videos', file);
            });

            const progressInterval = setInterval(() => {
                if (parseInt(progressBar.style.width) < 90) {
                    updateProgress(parseInt(progressBar.style.width) + 1);
                }
            }, 200);

            const response = await fetch('https://tools-as5l.onrender.com/api/video/merge', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '视频合并失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_video.mp4`;

            updateProgress(100);
            completeMerge();

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('合并失败:', error);
            alert(error.message || '视频合并失败，请重试');
            resetMerger();
        }
    }

    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `${value}%`;
    }

    function completeMerge() {
        statusText.textContent = '合并完成！';
        setTimeout(() => {
            alert('视频合并完成，即将开始下载...');
            resetMerger();
        }, 1000);
    }

    function resetMerger() {
        files = [];
        filesSection.style.display = 'none';
        progressSection.style.display = 'none';
        dropArea.style.display = 'block';
        mergeBtn.disabled = false;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusText.textContent = '正在合并中...';
        fileInput.value = '';
        updateFilesList();
    }
}); 