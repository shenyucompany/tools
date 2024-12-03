let selectedFile = null;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const watermarkOptions = document.getElementById('watermark-options');
    const watermarkButton = document.getElementById('watermark-button');
    const progress = document.getElementById('progress');

    // 水印选项元素
    const watermarkText = document.getElementById('watermark-text');
    const watermarkColor = document.getElementById('watermark-color');
    const watermarkOpacity = document.getElementById('watermark-opacity');
    const watermarkSize = document.getElementById('watermark-size');
    const watermarkAngle = document.getElementById('watermark-angle');

    // 显示值的元素
    const opacityValue = document.getElementById('opacity-value');
    const sizeValue = document.getElementById('size-value');
    const angleValue = document.getElementById('angle-value');

    // 更新显示值
    watermarkOpacity.addEventListener('input', () => {
        opacityValue.textContent = `${watermarkOpacity.value}%`;
    });

    watermarkSize.addEventListener('input', () => {
        sizeValue.textContent = `${watermarkSize.value}px`;
    });

    watermarkAngle.addEventListener('input', () => {
        angleValue.textContent = `${watermarkAngle.value}°`;
    });

    // 文件选择处理
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            fileInfo.innerHTML = '<div class="error-message">⚠️ 请选择PDF文件</div>';
            watermarkButton.disabled = true;
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

            watermarkOptions.style.display = 'block';
            watermarkButton.disabled = false;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            watermarkButton.disabled = true;
        }
    });

    // 添加水印按钮处理
    watermarkButton.addEventListener('click', async () => {
        if (!selectedFile || !watermarkText.value.trim()) {
            progress.innerHTML = '<div class="error-message">❌ 请选择PDF文件并输入水印文字</div>';
            return;
        }

        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            
            // 先加载字体
            const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

            // 获取水印设置
            const text = watermarkText.value.trim();
            const color = watermarkColor.value;
            const opacity = parseInt(watermarkOpacity.value) / 100;
            const size = parseInt(watermarkSize.value);

            // 转换颜色为RGB
            const r = parseInt(color.slice(1, 3), 16) / 255;
            const g = parseInt(color.slice(3, 5), 16) / 255;
            const b = parseInt(color.slice(5, 7), 16) / 255;

            // 处理每一页
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // 计算水印文本的大小
                const textWidth = helveticaFont.widthOfTextAtSize(text, size);
                const textHeight = size;

                // 计算水印间距
                const spacingX = textWidth * 6;
                const spacingY = textHeight * 6;

                // 计算需要重复的次数
                const repeatX = Math.ceil(width / spacingX) + 2;
                const repeatY = Math.ceil(height / spacingY) + 2;

                // 计算起始位置
                const startX = -width / 2;
                const startY = -height / 2;

                // 设置旋转角度（-45度）
                const angle = -45;

                // 绘制水印网格
                for (let y = -repeatY; y < repeatY; y++) {
                    for (let x = -repeatX; x < repeatX; x++) {
                        const xPos = startX + x * spacingX;
                        const yPos = startY + y * spacingY;

                        page.drawText(text, {
                            x: width/2 + xPos,
                            y: height/2 + yPos,
                            size: size,
                            font: helveticaFont,  // 使用已加载的字体
                            color: PDFLib.rgb(r, g, b),
                            opacity: opacity,
                            rotate: PDFLib.degrees(angle),
                        });
                    }
                }

                progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${pages.length} 页...</div>`;
            }

            // 保存并下载
            const pdfBytes = await pdfDoc.save();
            const newFileName = selectedFile.name.replace('.pdf', '_带水印.pdf');
            downloadPdf(pdfBytes, newFileName);

            progress.innerHTML = '<div class="success-message">✅ 水印添加完成！</div>';
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