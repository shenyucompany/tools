document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const overlayOptions = document.getElementById('overlay-options');
    const overlayButton = document.getElementById('overlay-button');
    const progress = document.getElementById('progress');
    const overlayOpacity = document.getElementById('overlay-opacity');
    const overlayOpacityDisplay = document.getElementById('overlay-opacity-display');

    let selectedFiles = [];

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图像文件</div>';
            overlayButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>已选择 ${selectedFiles.length} 个文件</p>
            </div>
        `;

        overlayOptions.style.display = 'block';
        overlayButton.disabled = false;
        progress.innerHTML = '';
    });

    // 叠加不透明度显示更新
    overlayOpacity.addEventListener('input', () => {
        overlayOpacityDisplay.textContent = `${overlayOpacity.value}%`;
    });

    // 叠加按钮处理
    overlayButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在叠加中...</div>';

        const images = await Promise.all(selectedFiles.map(file => loadImage(file)));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const baseImage = images[0];
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        ctx.drawImage(baseImage, 0, 0);

        const opacity = overlayOpacity.value / 100;
        ctx.globalAlpha = opacity;

        for (let i = 1; i < images.length; i++) {
            ctx.drawImage(images[i], 0, 0, baseImage.width, baseImage.height);
        }

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'overlayed-image.png';
            link.click();
            URL.revokeObjectURL(url);

            progress.innerHTML = '<div class="success-message">✅ 叠加完成！</div>';
        }, 'image/png');
    });

    // 加载图片
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}); 