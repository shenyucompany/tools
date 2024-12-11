document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.querySelector('.upload-area');
    const convertBtn = document.getElementById('convert-button');
    const progress = document.getElementById('progress');
    let selectedFiles = [];

    // 处理文件选择
    fileInput.addEventListener('change', handleFileSelect);

    // 处理拖放
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            selectedFiles = files;
            updateUI();
        }
    });

    // 处理文件选择
    function handleFileSelect(e) {
        selectedFiles = Array.from(e.target.files);
        updateUI();
    }

    // 更新UI状态
    function updateUI() {
        if (selectedFiles.length > 0) {
            convertBtn.disabled = false;
            progress.innerHTML = `已选择 ${selectedFiles.length} 个文件`;
        } else {
            convertBtn.disabled = true;
            progress.innerHTML = '';
        }
    }

    // 转换按钮点击事件
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        try {
            progress.innerHTML = '正在处理...';
            convertBtn.disabled = true;

            // 创建PDF文档
            const pdfDoc = await PDFLib.PDFDocument.create();

            // 处理每个图片
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                progress.innerHTML = `正在处理第 ${i + 1}/${selectedFiles.length} 个文件...`;

                // 读取图片文件
                const imageBytes = await readFileAsArrayBuffer(file);
                
                // 根据图片类型选择不同的嵌入方法
                let image;
                if (file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    continue; // 跳过不支持的格式
                }

                // 添加新页面
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            // 保存PDF
            const pdfBytes = await pdfDoc.save();
            
            // 下载文件
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_images.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            progress.innerHTML = '转换完成！';
        } catch (error) {
            console.error('Error:', error);
            progress.innerHTML = '转换失败: ' + error.message;
        } finally {
            convertBtn.disabled = false;
        }
    });

    // 辅助函数：将文件读取为ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
}); 