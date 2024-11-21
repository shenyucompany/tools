let selectedFile = null;
let totalPages = 0;
let selectedAngle = null;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const rotateOptions = document.getElementById('rotate-options');
    const saveButton = document.getElementById('save-button');
    const progress = document.getElementById('progress');
    const pageRanges = document.getElementById('page-ranges');
    const rotateButtons = document.querySelectorAll('.rotate-button');

    // 旋转按钮点击处理
    rotateButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除其他按钮的active类
            rotateButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            button.classList.add('active');
            // 保存选中的角度
            selectedAngle = parseInt(button.dataset.angle);
            // 启用保存按钮
            saveButton.disabled = !selectedFile || !selectedAngle;
        });
    });

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择PDF文件</div>';
            saveButton.disabled = true;
            return;
        }

        selectedFile = file;
        progress.innerHTML = '<div class="processing-message">⏳ 正在加载PDF信息...</div>';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            totalPages = pdfDoc.getPageCount();

            fileInfo.innerHTML = `
                <div class="success-message">
                    <p>文件名：${file.name}</p>
                    <p>总页数：${totalPages}页</p>
                    <p>文件大小：${formatFileSize(file.size)}</p>
                </div>
            `;

            rotateOptions.style.display = 'block';
            saveButton.disabled = !selectedAngle;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            saveButton.disabled = true;
        }
    });

    // 保存按钮处理
    saveButton.addEventListener('click', async () => {
        if (!selectedFile || !selectedAngle) {
            progress.innerHTML = '<div class="error-message">❌ 请选择PDF文件和旋转角度</div>';
            return;
        }

        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            // 获取要旋转的页面范围
            let pagesToRotate;
            if (pageRanges.value.trim()) {
                pagesToRotate = parsePageRanges(pageRanges.value, totalPages);
                if (pagesToRotate.length === 0) {
                    progress.innerHTML = '<div class="error-message">❌ 请输入有效的页面范围</div>';
                    return;
                }
            } else {
                // 如果没有输入页面范围，则处理所有页面
                pagesToRotate = Array.from({length: totalPages}, (_, i) => i);
            }

            // 旋转指定页面
            for (let i = 0; i < pagesToRotate.length; i++) {
                const pageIndex = pagesToRotate[i];
                const page = pages[pageIndex];
                progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${pageIndex + 1}/${totalPages} 页...</div>`;
                
                // 获取当前页面的旋转角度
                const currentRotation = page.getRotation().angle;
                // 计算新的旋转角度
                const newRotation = (currentRotation + selectedAngle) % 360;
                // 设置新的旋转角度
                page.setRotation(PDFLib.degrees(newRotation));
            }

            // 保存并下载
            const pdfBytes = await pdfDoc.save();
            const newFileName = selectedFile.name.replace('.pdf', '_已旋转.pdf');
            downloadPdf(pdfBytes, newFileName);

            progress.innerHTML = '<div class="success-message">✅ 旋转完成！</div>';
        } catch (error) {
            console.error('PDF处理错误:', error);
            progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    });
});

// 解析页面范围
function parsePageRanges(input, totalPages) {
    if (!input.trim()) return [];
    
    const ranges = [];
    const parts = input.split(',').map(part => part.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(num => parseInt(num));
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                continue;
            }
            for (let i = start - 1; i < end; i++) {
                ranges.push(i);
            }
        } else {
            const pageNum = parseInt(part);
            if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
                continue;
            }
            ranges.push(pageNum - 1);
        }
    }

    return [...new Set(ranges)].sort((a, b) => a - b);
}

// 下载PDF文件
function downloadPdf(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 文件大小格式化
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 