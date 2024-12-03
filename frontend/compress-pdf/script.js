let selectedFile = null;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const compressOptions = document.getElementById('compress-options');
    const compressButton = document.getElementById('compress-button');
    const progress = document.getElementById('progress');

    // 压缩选项元素
    const qualityLevel = document.getElementById('quality-level');
    const compressImages = document.getElementById('compress-images');
    const removeMetadata = document.getElementById('remove-metadata');

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择PDF文件</div>';
            compressButton.disabled = true;
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
                    <p>原始大小：${formatFileSize(file.size)}</p>
                </div>
            `;

            compressOptions.style.display = 'block';
            compressButton.disabled = false;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            compressButton.disabled = true;
        }
    });

    // 压缩按钮处理
    compressButton.addEventListener('click', async () => {
        if (!selectedFile) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在压缩中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // 创建新的PDF文档
            const compressedPdf = await PDFLib.PDFDocument.create();

            // 复制所有页面到新文档
            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
                progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${pages.length} 页...</div>`;
                
                const [copiedPage] = await compressedPdf.copyPages(pdfDoc, [i]);
                compressedPdf.addPage(copiedPage);
            }

            // 移除元数据
            if (removeMetadata.checked) {
                compressedPdf.setTitle('');
                compressedPdf.setAuthor('');
                compressedPdf.setSubject('');
                compressedPdf.setKeywords([]);
                compressedPdf.setCreator('');
                compressedPdf.setProducer('');
            }

            // 根据质量级别设置压缩参数
            const compressionOptions = {
                high: {
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectsPerTick: 30
                },
                medium: {
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectsPerTick: 20
                },
                low: {
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectsPerTick: 10
                }
            }[qualityLevel.value];

            // 保存并下载
            const pdfBytes = await compressedPdf.save(compressionOptions);

            const originalSize = selectedFile.size;
            const compressedSize = pdfBytes.length;

            if (compressedSize >= originalSize) {
                progress.innerHTML = `
                    <div class="warning-message">
                        <p>⚠️ 压缩后文件大小未减小，建议：</p>
                        <ul>
                            <li>尝试选择更低的压缩质量</li>
                            <li>或选择其他压缩工具</li>
                        </ul>
                    </div>
                `;
                return;
            }

            const newFileName = selectedFile.name.replace('.pdf', '_已压缩.pdf');
            downloadPdf(pdfBytes, newFileName);

            // 显示压缩结果
            const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

            progress.innerHTML = `
                <div class="success-message">
                    <p>✅ 压缩完成！</p>
                    <p>原始大小：${formatFileSize(originalSize)}</p>
                    <p>压缩后大小：${formatFileSize(compressedSize)}</p>
                    <p>压缩率：${compressionRatio}%</p>
                </div>
            `;
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