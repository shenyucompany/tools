document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const filterOptions = document.getElementById('filter-options');
    const applyFilterButton = document.getElementById('apply-filter-button');
    const progress = document.getElementById('progress');
    const filterType = document.getElementById('filter-type');
    const filterValueGroup = document.getElementById('filter-value-group');
    const filterValue = document.getElementById('filter-value');
    const filterValueDisplay = document.getElementById('filter-value-display');

    let selectedFile = null;

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (!selectedFile) {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择图像文件</div>';
            applyFilterButton.disabled = true;
            return;
        }

        fileInfo.innerHTML = `
            <div class="success-message">
                <p>文件名：${selectedFile.name}</p>
                <p>文件大小：${formatFileSize(selectedFile.size)}</p>
            </div>
        `;

        filterOptions.style.display = 'block';
        applyFilterButton.disabled = false;
        progress.innerHTML = '';
    });

    // 滤镜类型选择处理
    filterType.addEventListener('change', () => {
        const type = filterType.value;
        filterValueGroup.style.display = type === 'brightness' ? 'block' : 'none';
    });

    // 滤镜值显示更新
    filterValue.addEventListener('input', () => {
        filterValueDisplay.textContent = `${filterValue.value}%`;
    });

    // 应用滤镜按钮处理
    applyFilterButton.addEventListener('click', () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const type = filterType.value;
                let filter = '';

                switch (type) {
                    case 'grayscale':
                        filter = 'grayscale(100%)';
                        break;
                    case 'blur':
                        filter = 'blur(5px)';
                        break;
                    case 'brightness':
                        const brightness = filterValue.value / 100;
                        filter = `brightness(${brightness})`;
                        break;
                }

                ctx.filter = filter;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = selectedFile.name.replace(/\.[^/.]+$/, '_filtered.png');
                    link.click();
                    URL.revokeObjectURL(url);

                    progress.innerHTML = '<div class="success-message">✅ 滤镜应用完成！</div>';
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