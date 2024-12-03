document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('file-list');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    
    let selectedFile = null;

    // 修改：只在点击label时触发文件选择
    const uploadLabel = dropZone.querySelector('label');
    uploadLabel.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到dropZone
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
                <span class="file-size">${formatFileSize(selectedFile.size)}</span>
                <span class="file-remove">×</span>
            `;
            
            fileItem.querySelector('.file-remove').addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                selectedFile = null;
                updateFileList();
                convertBtn.disabled = true;
                fileInput.value = ''; // 清除文件输入
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
            // 模拟文件转换过程
            const progress = conversionStatus.querySelector('.progress');
            
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('file', selectedFile);

            // 发送转换请求
            const response = await fetch('/api/convert-pdf-to-word', {
                method: 'POST',
                body: formData,
                // 使用 ReadableStream 来跟踪上传进度
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progress.style.width = `${percentCompleted}%`;
                }
            });

            if (!response.ok) {
                throw new Error('转换失败');
            }

            // 获取转换后的文件
            const blob = await response.blob();
            
            // 创建下载链接
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = selectedFile.name.replace('.pdf', '.docx');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            // 显示成功消息
            conversionStatus.innerHTML = '<p style="color: #4CAF50;">✅ 转换完成！文件已自动下载</p>';
            convertBtn.disabled = false;

        } catch (error) {
            console.error('转换错误:', error);
            conversionStatus.innerHTML = '<p style="color: #dc3545;">❌ 转换失败，请重试</p>';
            convertBtn.disabled = false;
        }
    });

    // 文件大小格式化函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 