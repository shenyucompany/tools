document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const convertOptions = document.getElementById('convert-options');
    const convertButton = document.getElementById('convert-button');
    const progress = document.getElementById('progress');
    const outputFormat = document.getElementById('output-format');

    let selectedFiles = [];

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图片文件</div>';
            convertButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>已选择 ${selectedFiles.length} 个文件</p>
            </div>
        `;

        convertOptions.style.display = 'block';
        convertButton.disabled = false;
        progress.innerHTML = '';
    });

    // 转换按钮处理
    convertButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在转换中...</div>';

        for (const file of selectedFiles) {
            try {
                const image = await loadImage(file);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                const format = outputFormat.value;
                const mimeType = `image/${format}`;
                const dataUrl = canvas.toDataURL(mimeType);

                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = file.name.replace(/\.[^/.]+$/, `.${format}`);
                link.click();

                progress.innerHTML = '<div class="success-message">✅ 转换完成！</div>';
            } catch (error) {
                console.error('图片处理错误:', error);
                progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
            }
        }
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