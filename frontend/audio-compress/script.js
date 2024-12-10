document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const compressBtn = document.getElementById('compress-btn');
    const progress = document.getElementById('progress');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    let currentFile = null;

    // 更新质量显示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = `${this.value} kbps`;
    });

    // 文件选择处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            currentFile = file;
            displayFile(file);
            compressBtn.disabled = false;
        }
    });

    // 显示文件信息
    function displayFile(file) {
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
        `;
    }

    // 压缩处理
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('quality', qualitySlider.value);
        formData.append('output_format', document.getElementById('output-format').value);

        compressBtn.disabled = true;
        const originalText = compressBtn.textContent;
        compressBtn.textContent = '处理中...';

        progress.innerHTML = `
            <div class="processing-message">
                正在压缩音频文件，请稍候...
            </div>
        `;

        try {
            const response = await fetch('http://localhost:8000/api/audio/compress', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compressed_${currentFile.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                progress.innerHTML = `
                    <div class="success-message">
                        压缩完成！文件已自动下载。
                    </div>
                `;
            } else {
                const error = await response.json();
                throw new Error(error.detail || '压缩失败');
            }
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = `
                <div class="error-message">
                    压缩失败：${error.message}
                </div>
            `;
        } finally {
            compressBtn.disabled = false;
            compressBtn.textContent = originalText;
        }
    });

    // 辅助函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 