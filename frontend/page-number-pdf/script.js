let selectedFile = null;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const pageNumberOptions = document.getElementById('page-number-options');
    const addPageNumberButton = document.getElementById('add-page-number-button');
    const progress = document.getElementById('progress');

    // 页码选项元素
    const startNumber = document.getElementById('start-number');
    const position = document.getElementById('position');
    const fontSize = document.getElementById('font-size');
    const margin = document.getElementById('margin');
    const skipFirstPage = document.getElementById('skip-first-page');

    // 显示值的元素
    const fontSizeValue = document.getElementById('font-size-value');
    const marginValue = document.getElementById('margin-value');

    // 更新显示值
    fontSize.addEventListener('input', () => {
        fontSizeValue.textContent = `${fontSize.value}px`;
    });

    margin.addEventListener('input', () => {
        marginValue.textContent = `${margin.value}mm`;
    });

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择PDF文件</div>';
            addPageNumberButton.disabled = true;
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

            pageNumberOptions.style.display = 'block';
            addPageNumberButton.disabled = false;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            addPageNumberButton.disabled = true;
        }
    });

    // 添加页码按钮处理
    addPageNumberButton.addEventListener('click', async () => {
        if (!selectedFile) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const startPage = skipFirstPage.checked ? 1 : 0;
            const pageNumStart = parseInt(startNumber.value);

            // 获取页码设置
            const fontSizeValue = parseInt(fontSize.value);
            const marginValue = parseInt(margin.value);
            const positionValue = position.value;

            // 处理每一页
            for (let i = startPage; i < pages.length; i++) {
                progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${pages.length} 页...</div>`;
                
                const page = pages[i];
                const { width, height } = page.getSize();
                const pageNumber = pageNumStart + i - startPage;

                // 计算页码位置
                let x = width / 2;
                let y = marginValue;

                switch (positionValue) {
                    case 'bottom-left':
                        x = marginValue;
                        break;
                    case 'bottom-right':
                        x = width - marginValue;
                        break;
                    case 'top-center':
                        y = height - marginValue;
                        break;
                    case 'top-left':
                        x = marginValue;
                        y = height - marginValue;
                        break;
                    case 'top-right':
                        x = width - marginValue;
                        y = height - marginValue;
                        break;
                }

                // 添加页码
                page.drawText(pageNumber.toString(), {
                    x: x,
                    y: y,
                    size: fontSizeValue,
                    font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
                    color: PDFLib.rgb(0, 0, 0),
                });
            }

            // 保存并下载
            const pdfBytes = await pdfDoc.save();
            const newFileName = selectedFile.name.replace('.pdf', '_带页码.pdf');
            downloadPdf(pdfBytes, newFileName);

            progress.innerHTML = '<div class="success-message">✅ 页码添加完成！</div>';
        } catch (error) {
            console.error('PDF处理错误:', error);
            progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    });
});

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