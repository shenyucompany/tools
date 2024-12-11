document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const convertBtn = document.getElementById('convert-btn');
    const progress = document.getElementById('progress');

    // 添加后端服务器地址
    const API_BASE_URL = 'https://tools-as5l.onrender.com';

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            displayFile(file);
            convertBtn.disabled = false;
        }
    });

    function displayFile(file) {
        const fileSize = formatFileSize(file.size);
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        `;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 处理转换
    convertBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const targetFormat = document.getElementById('target-format').value;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_format', targetFormat);

        // 显示进度信息
        progress.innerHTML = `
            <div class="processing-message">
                正在转换音频文件，请稍候...
            </div>
        `;
        convertBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/api/audio/convert`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `converted_${file.name.split('.')[0]}.${targetFormat}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                progress.innerHTML = `
                    <div class="success-message">
                        转换完成！文件已自动下载。
                    </div>
                `;
            } else {
                throw new Error('转换失败');
            }
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = `
                <div class="error-message">
                    转换失败，请重试。
                </div>
            `;
        } finally {
            convertBtn.disabled = false;
        }
    });
}); 