document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const editBtn = document.getElementById('edit-btn');
    const progress = document.getElementById('progress');
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    const fadeInSlider = document.getElementById('fade-in');
    const fadeInValue = document.getElementById('fade-in-value');
    const fadeOutSlider = document.getElementById('fade-out');
    const fadeOutValue = document.getElementById('fade-out-value');
    const normalizeCheckbox = document.getElementById('normalize');
    let currentFile = null;

    // 更新滑块值显示
    volumeSlider.addEventListener('input', function() {
        volumeValue.textContent = `${this.value} dB`;
    });

    fadeInSlider.addEventListener('input', function() {
        fadeInValue.textContent = `${this.value} 秒`;
    });

    fadeOutSlider.addEventListener('input', function() {
        fadeOutValue.textContent = `${this.value} 秒`;
    });

    // 文件选择处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            currentFile = file;
            displayFile(file);
            editBtn.disabled = false;
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

    // 编辑处理
    editBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('volume', volumeSlider.value);
        formData.append('fade_in', fadeInSlider.value);
        formData.append('fade_out', fadeOutSlider.value);
        formData.append('normalize', normalizeCheckbox.checked);

        editBtn.disabled = true;
        const originalText = editBtn.textContent;
        editBtn.textContent = '处理中...';

        progress.innerHTML = `
            <div class="processing-message">
                正在编辑音频文件，请稍候...
            </div>
        `;

        try {
            const response = await fetch('http://localhost:8000/api/audio/edit', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edited_${currentFile.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                progress.innerHTML = `
                    <div class="success-message">
                        编辑完成！文件已自动下载。
                    </div>
                `;
            } else {
                const error = await response.json();
                throw new Error(error.detail || '编辑失败');
            }
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = `
                <div class="error-message">
                    编辑失败：${error.message}
                </div>
            `;
        } finally {
            editBtn.disabled = false;
            editBtn.textContent = originalText;
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