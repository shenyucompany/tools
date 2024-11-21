document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const mergeOptions = document.getElementById('merge-options');
    const mergeButton = document.getElementById('merge-button');
    const progress = document.getElementById('progress');
    const mergeDirection = document.getElementById('merge-direction');

    let selectedFiles = [];

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图像文件</div>';
            mergeButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>已选择 ${selectedFiles.length} 个文件</p>
            </div>
        `;

        mergeOptions.style.display = 'block';
        mergeButton.disabled = false;
        progress.innerHTML = '';
    });

    // 合并按钮处理
    mergeButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在合并中...</div>';

        const images = await Promise.all(selectedFiles.map(file => loadImage(file)));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const direction = mergeDirection.value;
        let totalWidth = 0;
        let totalHeight = 0;

        if (direction === 'horizontal') {
            totalWidth = images.reduce((sum, img) => sum + img.width, 0);
            totalHeight = Math.max(...images.map(img => img.height));
            canvas.width = totalWidth;
            canvas.height = totalHeight;

            let xOffset = 0;
            images.forEach(img => {
                ctx.drawImage(img, xOffset, 0);
                xOffset += img.width;
            });
        } else {
            totalWidth = Math.max(...images.map(img => img.width));
            totalHeight = images.reduce((sum, img) => sum + img.height, 0);
            canvas.width = totalWidth;
            canvas.height = totalHeight;

            let yOffset = 0;
            images.forEach(img => {
                ctx.drawImage(img, 0, yOffset);
                yOffset += img.height;
            });
        }

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged-image.png';
            link.click();
            URL.revokeObjectURL(url);

            progress.innerHTML = '<div class="success-message">✅ 合并完成！</div>';
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