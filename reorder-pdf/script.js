let selectedFile = null;
let totalPages = 0;
let pageOrder = [];
let sortable = null;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const pagesContainer = document.getElementById('pages-container');
    const pagesList = document.getElementById('pages-list');
    const saveButton = document.getElementById('save-button');
    const progress = document.getElementById('progress');
    
    // 快捷操作按钮
    const reverseOrderBtn = document.getElementById('reverse-order');
    const sortAscendingBtn = document.getElementById('sort-ascending');
    const sortDescendingBtn = document.getElementById('sort-descending');

    // 初始化拖拽排序
    sortable = new Sortable(pagesList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: function() {
            // 更新页面顺序
            updatePageOrder();
        }
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

            // 初始化页面顺序
            pageOrder = Array.from({length: totalPages}, (_, i) => i);
            
            // 生成页面列表
            generatePagesList();

            pagesContainer.style.display = 'block';
            saveButton.disabled = false;
            progress.innerHTML = '';
        } catch (error) {
            fileInfo.innerHTML = '<div class="error-message">❌ PDF文件加载失败</div>';
            saveButton.disabled = true;
        }
    });

    // 反转顺序
    reverseOrderBtn.addEventListener('click', () => {
        pageOrder.reverse();
        generatePagesList();
    });

    // 升序排列
    sortAscendingBtn.addEventListener('click', () => {
        pageOrder.sort((a, b) => a - b);
        generatePagesList();
    });

    // 降序排列
    sortDescendingBtn.addEventListener('click', () => {
        pageOrder.sort((a, b) => b - a);
        generatePagesList();
    });

    // 保存按钮处理
    saveButton.addEventListener('click', async () => {
        if (!selectedFile) return;

        progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const newPdf = await PDFLib.PDFDocument.create();

            // 按新顺序复制页面
            for (let i = 0; i < pageOrder.length; i++) {
                progress.innerHTML = `<div class="processing-message">⏳ 正在处理第 ${i + 1}/${pageOrder.length} 页...</div>`;
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageOrder[i]]);
                newPdf.addPage(copiedPage);
            }

            // 保存并下载
            const pdfBytes = await newPdf.save();
            const newFileName = selectedFile.name.replace('.pdf', '_已排序.pdf');
            downloadPdf(pdfBytes, newFileName);

            progress.innerHTML = '<div class="success-message">✅ 排序完成！</div>';
        } catch (error) {
            console.error('PDF处理错误:', error);
            progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        }
    });

    // 生成页面列表
    function generatePagesList() {
        pagesList.innerHTML = pageOrder.map((pageIndex, index) => `
            <div class="page-item" data-index="${pageIndex}">
                <div class="page-preview">
                    <span class="page-number">${pageIndex + 1}</span>
                </div>
                <div class="page-info">
                    第 ${pageIndex + 1} 页
                </div>
            </div>
        `).join('');
    }

    // 更新页面顺序
    function updatePageOrder() {
        pageOrder = Array.from(pagesList.children).map(item => 
            parseInt(item.dataset.index)
        );
    }
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