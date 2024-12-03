document.addEventListener('DOMContentLoaded', function() {
    const folderInput = document.getElementById('folder-input');
    const fileList = document.getElementById('file-list');
    const convertButton = document.getElementById('convert-button');
    const progress = document.getElementById('progress');
    
    let selectedFiles = [];
    
    // 支持的图片格式
    const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    
    folderInput.addEventListener('change', async function(e) {
        selectedFiles = Array.from(e.target.files)
            .filter(file => supportedFormats.includes(file.type))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        if (selectedFiles.length === 0) {
            progress.textContent = '未找到支持的图片文件';
            convertButton.disabled = true;
            return;
        }
        
        displayFileList();
        convertButton.disabled = false;
    });
    
    function displayFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // 创建图片预览
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);
            
            fileItem.appendChild(img);
            fileItem.appendChild(fileInfo);
            fileList.appendChild(fileItem);
        });
    }
    
    convertButton.addEventListener('click', async function() {
        convertButton.disabled = true;
        progress.textContent = '正在处理图片...';
        
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                progress.textContent = `正在处理 ${file.name} (${i + 1}/${selectedFiles.length})`;
                
                // 读取图片文件
                const imageBytes = await readFileAsArrayBuffer(file);
                
                // 根据图片类型选择适当的方法
                let image;
                if (file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    // 对于其他格式，先转换为PNG
                    const pngBytes = await convertToPng(imageBytes);
                    image = await pdfDoc.embedPng(pngBytes);
                }
                
                // 创建新页面
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }
            
            progress.textContent = '正在生成PDF...';
            const pdfBytes = await pdfDoc.save();
            
            // 下载文件
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'converted_images.pdf';
            link.click();
            
            progress.textContent = 'PDF文件已生成并开始下载！';
        } catch (error) {
            console.error(error);
            progress.textContent = '处理过程中出现错误，请重试';
        } finally {
            convertButton.disabled = false;
        }
    });
    
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async function convertToPng(imageBytes) {
        // 使用 Canvas 将其他格式转换为 PNG
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(blob);
                }, 'image/png');
            };
            
            img.src = URL.createObjectURL(new Blob([imageBytes]));
        });
    }
}); 