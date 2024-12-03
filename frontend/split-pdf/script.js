let selectedFile = null;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const splitOptions = document.getElementById('split-options');
    const splitButton = document.getElementById('split-button');
    const progress = document.getElementById('progress');
    const pageRanges = document.getElementById('page-ranges');
    const rangeInput = document.getElementById('range-input');

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择PDF文件</div>';
            splitButton.disabled = true;
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

            splitOptions.style.display = 'block';
            splitButton.disabled = false;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            splitButton.disabled = true;
        }
    });

    // 拆分方式切换处理
    document.querySelectorAll('input[name="split-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            rangeInput.style.display = e.target.value === 'range' ? 'block' : 'none';
            if (e.target.value === 'single') {
                pageRanges.value = '';
            }
        });
    });

    // 拆分按钮处理
    splitButton.addEventListener('click', async () => {
        if (!selectedFile) return;

        const splitMethod = document.querySelector('input[name="split-method"]:checked').value;
        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            if (splitMethod === 'single') {
                // 拆分为单页PDF
                for (let i = 0; i < totalPages; i++) {
                    progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${totalPages} 页...</div>`;
                    
                    // 创建新的PDF文档
                    const newPdf = await PDFLib.PDFDocument.create();
                    // 复制单页
                    const [page] = await newPdf.copyPages(pdfDoc, [i]);
                    newPdf.addPage(page);

                    // 保存并下载单页PDF
                    const pdfBytes = await newPdf.save();
                    const filename = `第${i + 1}页.pdf`;
                    await downloadPdf(pdfBytes, filename);

                    // 等待一小段时间再处理下一页，避免浏览器阻止多个下载
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } else {
                // 按页面范围拆分
                const ranges = parsePageRanges(pageRanges.value, totalPages);
                if (ranges.length === 0) {
                    progress.innerHTML = '<div class="error-message">❌ 请输入有效的页面范围</div>';
                    return;
                }

                // 处理每个范围
                for (let i = 0; i < ranges.length; i++) {
                    const range = ranges[i];
                    progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${ranges.length} 个范围...</div>`;

                    // 创建新的PDF文档
                    const newPdf = await PDFLib.PDFDocument.create();
                    
                    // 复制该范围内的所有页面
                    const pages = await newPdf.copyPages(pdfDoc, range.pages);
                    pages.forEach(page => newPdf.addPage(page));

                    // 生成文件名
                    const filename = range.start === range.end 
                        ? `第${range.start + 1}页.pdf`
                        : `第${range.start + 1}-${range.end + 1}页.pdf`;

                    // 保存并下载
                    const pdfBytes = await newPdf.save();
                    await downloadPdf(pdfBytes, filename);

                    // 添加延迟避免浏览器阻止多个下载
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            progress.innerHTML = '<div class="success-message">✅ 拆分完成！</div>';
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
            // 处理范围，如 "1-3"
            const [start, end] = part.split('-').map(num => parseInt(num));
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                continue;
            }
            ranges.push({
                start: start - 1,
                end: end - 1,
                pages: Array.from({length: end - start + 1}, (_, i) => start - 1 + i)
            });
        } else {
            // 处理单页，如 "5"
            const pageNum = parseInt(part);
            if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
                continue;
            }
            ranges.push({
                start: pageNum - 1,
                end: pageNum - 1,
                pages: [pageNum - 1]
            });
        }
    }

    return ranges;
}

// 文件大小格式化
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 优化下载函数
async function downloadPdf(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
} 