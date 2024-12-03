document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    
    let selectedFile = null;

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件拖拽相关事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type !== 'application/pdf') {
            alert('请选择PDF文件');
            return;
        }

        selectedFile = file;
        updateFileList();
        convertBtn.disabled = false;
    }

    function updateFileList() {
        fileList.innerHTML = '';
        if (selectedFile) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${selectedFile.name}</span>
                <span class="file-remove">×</span>
            `;
            
            fileItem.querySelector('.file-remove').addEventListener('click', () => {
                selectedFile = null;
                updateFileList();
                convertBtn.disabled = true;
            });

            fileList.appendChild(fileItem);
        }
    }

    // 转换按钮点击事件
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        convertBtn.disabled = true;
        conversionStatus.innerHTML = `
            <p>正在转换中...</p>
            <div class="progress-bar">
                <div class="progress" style="width: 0%"></div>
            </div>
        `;

        try {
            // 这里添加实际的PDF转Word转换逻辑
            // 示例进度条动画
            const progress = conversionStatus.querySelector('.progress');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    conversionStatus.innerHTML = '<p>转换完成！</p>';
                    // 这里添加下载转换后的文件的逻辑
                } else {
                    width += 1;
                    progress.style.width = width + '%';
                }
            }, 50);
        } catch (error) {
            conversionStatus.innerHTML = '<p style="color: #dc3545;">转换失败，请重试</p>';
            convertBtn.disabled = false;
        }
    });
}); 