document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const mergeBtn = document.getElementById('merge-btn');
    const progress = document.getElementById('progress');
    const files = new Set();

    // 初始化拖拽排序
    new Sortable(fileList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: updateFileNumbers
    });

    // 文件选择处理
    fileInput.addEventListener('change', function(e) {
        const newFiles = Array.from(e.target.files);
        newFiles.forEach(file => files.add(file));
        displayFiles();
        mergeBtn.disabled = files.size < 2;
    });

    // 显示文件列表
    function displayFiles() {
        fileList.innerHTML = Array.from(files).map((file, index) => `
            <div class="file-item" data-file-name="${file.name}">
                <div class="file-number">${index + 1}</div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-remove" onclick="removeFile('${file.name}')">✕</div>
            </div>
        `).join('');
    }

    // 更新文件序号
    function updateFileNumbers() {
        const items = fileList.querySelectorAll('.file-item');
        items.forEach((item, index) => {
            item.querySelector('.file-number').textContent = index + 1;
        });
    }

    // 删除文件
    window.removeFile = function(fileName) {
        files.forEach(file => {
            if (file.name === fileName) {
                files.delete(file);
            }
        });
        displayFiles();
        mergeBtn.disabled = files.size < 2;
    };

    // 合并处理
    mergeBtn.addEventListener('click', async () => {
        if (files.size < 2) return;

        const formData = new FormData();
        const fileOrder = Array.from(fileList.querySelectorAll('.file-item')).map(item => item.dataset.fileName);
        
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        formData.append('file_order', JSON.stringify(fileOrder));
        formData.append('output_format', document.getElementById('output-format').value);

        mergeBtn.disabled = true;
        const originalText = mergeBtn.textContent;
        mergeBtn.textContent = '处理中...';

        progress.innerHTML = `
            <div class="processing-message">
                正在合并音频文件，请稍候...
            </div>
        `;

        try {
            const response = await fetch('http://localhost:8000/api/audio/merge', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `merged_audio.${document.getElementById('output-format').value}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                progress.innerHTML = `
                    <div class="success-message">
                        合并完成！文件已自动下载。
                    </div>
                `;
            } else {
                const error = await response.json();
                throw new Error(error.detail || '合并失败');
            }
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = `
                <div class="error-message">
                    合并失败：${error.message}
                </div>
            `;
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = originalText;
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