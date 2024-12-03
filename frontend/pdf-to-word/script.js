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

        // 检查文件大小
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (selectedFile.size > maxSize) {
            conversionStatus.innerHTML = '<p style="color: #dc3545;">❌ 文件大小超过限制（最大100MB）</p>';
            return;
        }

        convertBtn.disabled = true;
        conversionStatus.innerHTML = `
            <p>正在转换中...</p>
            <div class="progress-bar">
                <div class="progress" style="width: 0%"></div>
            </div>
            <p class="progress-text">准备转换...</p>
        `;

        try {
            const progress = conversionStatus.querySelector('.progress');
            const progressText = conversionStatus.querySelector('.progress-text');
            
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('file', selectedFile);

            // 修改：使用 XMLHttpRequest 来处理上传进度
            const xhr = new XMLHttpRequest();
            
            // 创建一个 Promise 来处理异步请求
            const response = await new Promise((resolve, reject) => {
                // 上传进度
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 50; // 上传占50%进度
                        progress.style.width = percentComplete + '%';
                        progressText.textContent = `上传中... ${Math.round(percentComplete)}%`;
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        progress.style.width = '100%';
                        progressText.textContent = '转换完成！';
                        resolve(xhr.response);
                    } else {
                        reject(new Error(xhr.responseText || '转换失败'));
                    }
                };

                xhr.onerror = () => reject(new Error('网络错误'));

                // 修改 API 地址
                const API_URL = 'https://your-railway-app-url.railway.app';  // 替换为你的 Railway 域名

                xhr.open('POST', `${API_URL}/api/convert-pdf-to-word`);
                xhr.responseType = 'blob';
                xhr.send(formData);

                // 模拟转换进度（因为服务器没有实时进度反馈）
                let conversionProgress = 50;
                const interval = setInterval(() => {
                    if (conversionProgress < 90) {
                        conversionProgress += 1;
                        progress.style.width = conversionProgress + '%';
                        progressText.textContent = `转换中... ${Math.round(conversionProgress)}%`;
                    } else {
                        clearInterval(interval);
                    }
                }, 100);
            });

            // 创建下载链接
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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
            conversionStatus.innerHTML = `<p style="color: #dc3545;">❌ ${error.message}</p>`;
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