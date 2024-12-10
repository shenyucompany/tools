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
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const pitchSlider = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitch-value');
    const bassSlider = document.getElementById('bass');
    const bassValue = document.getElementById('bass-value');
    const midSlider = document.getElementById('mid');
    const midValue = document.getElementById('mid-value');
    const trebleSlider = document.getElementById('treble');
    const trebleValue = document.getElementById('treble-value');
    const noiseReduceSlider = document.getElementById('noise-reduce');
    const noiseValue = document.getElementById('noise-value');
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

    // 更新速度显示
    speedSlider.addEventListener('input', function() {
        speedValue.textContent = `${this.value}x`;
    });

    // 更新音调显示
    pitchSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const sign = value > 0 ? '+' : '';
        pitchValue.textContent = `${sign}${value} 半音`;
    });

    // 更新均衡器显示
    bassSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const sign = value > 0 ? '+' : '';
        bassValue.textContent = `${sign}${value} dB`;
    });

    midSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const sign = value > 0 ? '+' : '';
        midValue.textContent = `${sign}${value} dB`;
    });

    trebleSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const sign = value > 0 ? '+' : '';
        trebleValue.textContent = `${sign}${value} dB`;
    });

    // 添加降噪滑块的事件监听
    noiseReduceSlider.addEventListener('input', function() {
        noiseValue.textContent = `${this.value}%`;
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
        formData.append('noise_reduce', noiseReduceSlider.value / 100); // 转换为0-1的值
        formData.append('fade_in', fadeInSlider.value);
        formData.append('fade_out', fadeOutSlider.value);
        formData.append('normalize', normalizeCheckbox.checked);
        formData.append('speed', speedSlider.value);
        formData.append('pitch', pitchSlider.value);
        formData.append('bass', bassSlider.value);
        formData.append('mid', midSlider.value);
        formData.append('treble', trebleSlider.value);

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