let selectedFile = null;
let totalPages = 0;
let annotations = [];

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const annotationOptions = document.getElementById('annotation-options');
    const annotationsList = document.getElementById('annotations-list');
    const saveButton = document.getElementById('save-button');
    const progress = document.getElementById('progress');

    // 注释选项元素
    const pageNumber = document.getElementById('page-number');
    const annotationText = document.getElementById('annotation-text');
    const textColor = document.getElementById('text-color');
    const fontSize = document.getElementById('font-size');
    const positionX = document.getElementById('position-x');
    const positionY = document.getElementById('position-y');
    const addAnnotationButton = document.getElementById('add-annotation-button');
    const annotationsContainer = document.getElementById('annotations-container');

    // 显示值的元素
    const fontSizeValue = document.getElementById('font-size-value');

    // 更新显示值
    fontSize.addEventListener('input', () => {
        fontSizeValue.textContent = `${fontSize.value}px`;
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

            // 重置页码输入范围
            pageNumber.max = totalPages;
            
            annotationOptions.style.display = 'block';
            annotationsList.style.display = 'block';
            saveButton.disabled = false;
            progress.innerHTML = '';
            
            // 清空之前的注释
            annotations = [];
            updateAnnotationsList();
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            saveButton.disabled = true;
        }
    });

    // 添加注释按钮处理
    addAnnotationButton.addEventListener('click', () => {
        const page = parseInt(pageNumber.value);
        const text = annotationText.value.trim();
        const color = textColor.value;
        const size = parseInt(fontSize.value);
        const x = parseInt(positionX.value);
        const y = parseInt(positionY.value);

        if (!text || isNaN(page) || page < 1 || page > totalPages || 
            isNaN(x) || isNaN(y)) {
            progress.innerHTML = '<div class="error-message">❌ 请填写完整的注释信息</div>';
            return;
        }

        annotations.push({
            page: page - 1, // 转换为0基索引
            text,
            color,
            size,
            x,
            y
        });

        // 清空输入
        annotationText.value = '';
        positionX.value = '';
        positionY.value = '';

        updateAnnotationsList();
        progress.innerHTML = '<div class="success-message">✅ 注释已添加</div>';
    });

    // 保存按钮处理
    saveButton.addEventListener('click', async () => {
        if (!selectedFile || annotations.length === 0) {
            progress.innerHTML = '<div class="error-message">❌ 请先添加注释</div>';
            return;
        }

        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // 添加所有注释
            for (const annotation of annotations) {
                const page = pdfDoc.getPages()[annotation.page];
                const { r, g, b } = hexToRgb(annotation.color);
                
                page.drawText(annotation.text, {
                    x: annotation.x,
                    y: annotation.y,
                    size: annotation.size,
                    color: PDFLib.rgb(r/255, g/255, b/255),
                    font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
                });
            }

            // 保存并下载
            const pdfBytes = await pdfDoc.save();
            const newFileName = selectedFile.name.replace('.pdf', '_带注释.pdf');
            downloadPdf(pdfBytes, newFileName);

            progress.innerHTML = '<div class="success-message">✅ 注释添加完成！</div>';
        } catch (error) {
            console.error('PDF处理错误:', error);
            progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    });

    // 更新注释列表显示
    function updateAnnotationsList() {
        annotationsContainer.innerHTML = annotations.length === 0 
            ? '<p>暂无注释</p>'
            : annotations.map((annotation, index) => `
                <div class="annotation-item">
                    <div class="annotation-info">
                        <p>页码: ${annotation.page + 1}</p>
                        <p>内容: ${annotation.text}</p>
                        <p>位置: (${annotation.x}, ${annotation.y})</p>
                    </div>
                    <div class="annotation-actions">
                        <button class="delete-button" onclick="deleteAnnotation(${index})">删除</button>
                    </div>
                </div>
            `).join('');
    }

    // 删除注释
    window.deleteAnnotation = function(index) {
        annotations.splice(index, 1);
        updateAnnotationsList();
        progress.innerHTML = '<div class="success-message">✅ 注释已删除</div>';
    };
});

// 颜色转换函数
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
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