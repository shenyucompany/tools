document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const resizeOptions = document.getElementById('resize-options');
    const resizeButton = document.getElementById('resize-button');
    const progress = document.getElementById('progress');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');

    let selectedFile = null;

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (!selectedFile) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图像文件</div>';
            resizeButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>文件名：${selectedFile.name}</p>
                <p>文件大小：${formatFileSize(selectedFile.size)}</p>
            </div>
        `;

        resizeOptions.style.display = 'block';
        resizeButton.disabled = false;
        progress.innerHTML = '';
    });

    // 调整大小按钮处理
    resizeButton.addEventListener('click', () => {
        if (!selectedFile) return;

        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            progress.innerHTML = '<div class="error-message">❌ 请输入有效的宽度和高度</div>';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = selectedFile.name.replace(/\.[^/.]+$/, '_resized.png');
                    link.click();
                    URL.revokeObjectURL(url);

                    progress.innerHTML = '<div class="success-message">✅ 调整完成！</div>';
                }, 'image/png');
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(selectedFile);
    });

    // 文件大小格式化
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 