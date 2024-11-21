document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const watermarkOptions = document.getElementById('watermark-options');
    const watermarkButton = document.getElementById('add-watermark-button');
    const progress = document.getElementById('progress');
    const watermarkText = document.getElementById('watermark-text');
    const watermarkColor = document.getElementById('watermark-color');
    const watermarkOpacity = document.getElementById('watermark-opacity');
    const watermarkSize = document.getElementById('watermark-size');

    let selectedFile = null;

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (!selectedFile) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图片文件</div>';
            watermarkButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>文件名：${selectedFile.name}</p>
                <p>文件大小：${formatFileSize(selectedFile.size)}</p>
            </div>
        `;

        watermarkOptions.style.display = 'block';
        watermarkButton.disabled = false;
        progress.innerHTML = '';
    });

    // 监听水印文本输入
    watermarkText.addEventListener('input', () => {
        // 当有文件和水印文本时启用按钮
        watermarkButton.disabled = !selectedFile || !watermarkText.value.trim();
    });

    // 添加水印按钮处理
    watermarkButton.addEventListener('click', () => {
        if (!selectedFile || !watermarkText.value.trim()) {
            progress.innerHTML = '<div class="error-message">❌ 请选择图片文件并输入水印文字</div>';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 设置画布大小为图片大小
                canvas.width = img.width;
                canvas.height = img.height;

                // 绘制原图
                ctx.drawImage(img, 0, 0);

                // 设置水印样式
                const text = watermarkText.value.trim();
                const color = watermarkColor.value;
                const opacity = parseInt(watermarkOpacity.value) / 100;
                const size = parseInt(watermarkSize.value);

                // 转换颜色为RGBA
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.font = `${size}px Arial`;

                // 计算水印文本的大小
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const textHeight = size;

                // 设置旋转角度（-45度）
                const angle = -45 * Math.PI / 180;

                // 计算水印间距（进一步增加间距）
                const spacingX = textWidth * 5;
                const spacingY = textHeight * 5;

                // 计算需要重复的次数
                const repeatX = Math.ceil(canvas.width / spacingX);
                const repeatY = Math.ceil(canvas.height / spacingY);

                // 计算起始位置（调整偏移量）
                const startX = -canvas.width / 3;
                const startY = -canvas.height / 3;

                // 保存当前上下文状态
                ctx.save();

                // 设置旋转中心点
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(angle);

                // 绘制水印网格
                for (let i = -repeatY; i < repeatY; i++) {
                    for (let j = -repeatX; j < repeatX; j++) {
                        const x = startX + j * spacingX;
                        const y = startY + i * spacingY;
                        ctx.fillText(text, x, y);
                    }
                }

                // 恢复上下文状态
                ctx.restore();

                // 导出图片
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = selectedFile.name.replace(/\.[^/.]+$/, '_带水印.png');
                    link.click();
                    URL.revokeObjectURL(url);

                    progress.innerHTML = '<div class="success-message">✅ 水印添加完成！</div>';
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