document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const cropContainer = document.getElementById('crop-container');
    const imageElement = document.getElementById('image');
    const cropButton = document.getElementById('crop-button');
    const progress = document.getElementById('progress');

    let cropper = null;

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图像文件</div>';
            cropButton.disabled = true;
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            imageElement.src = reader.result;
            cropContainer.style.display = 'block';
            cropButton.disabled = false;

            // 初始化Cropper.js
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(imageElement, {
                aspectRatio: NaN,
                viewMode: 1,
                autoCropArea: 1,
                responsive: true,
                background: false
            });
        };
        reader.readAsDataURL(file);

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>文件名：${file.name}</p>
                <p>文件大小：${formatFileSize(file.size)}</p>
            </div>
        `;
    });

    // 裁剪按钮处理
    cropButton.addEventListener('click', () => {
        if (!cropper) return;

        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cropped-image.png';
            link.click();
            URL.revokeObjectURL(url);

            progress.innerHTML = '<div class="success-message">✅ 裁剪完成！</div>';
        }, 'image/png');
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