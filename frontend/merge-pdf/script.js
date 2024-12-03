let selectedFiles = [];

// 将所有图片相关的代码包装在 DOMContentLoaded 事件中
document.addEventListener('DOMContentLoaded', function() {
    // 图片放大功能
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.getElementsByClassName('modal-close')[0];

    // 为所有可放大的图片添加点击事件
    document.querySelectorAll('.zoomable-image').forEach(img => {
        img.onclick = function() {
            modal.style.display = 'flex';
            modalImg.src = this.src;
            modalCaption.textContent = this.alt;
            setTimeout(() => modal.classList.add('show'), 10);
        };
    });

    // 修改关闭模态框的函数
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // 点击关闭按钮关闭模态框
    closeBtn.onclick = closeModal;

    // 点击模态框外部关闭模态框
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    // ESC键关闭模态框
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
});

// 文件处理相关代码保持不变
document.getElementById('folder-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    const fileList = document.getElementById('file-list');
    const progress = document.getElementById('progress');
    
    // 清除之前的提示
    progress.innerHTML = '';
    
    // 检查是否有PDF文件
    if (files.length === 0) {
        fileList.innerHTML = '<div class="error-message">⚠️ 所选文件夹中没有PDF文件，请选择包含PDF文件的文件夹</div>';
        document.getElementById('merge-button').disabled = true;
        return;
    }
    
    // 有PDF文件，显示文件列表
    selectedFiles = files;
    fileList.innerHTML = `
        <h3>选中的PDF文件（${files.length}个）：</h3>
        <div class="file-list-container">
            ${files.map((file, index) => `
                <div class="file-item">
                    <span class="file-number">${index + 1}.</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('merge-button').disabled = files.length < 2;
    
    // 如果文件数量小于2，显示提示
    if (files.length === 1) {
        progress.innerHTML = '<div class="warning-message">⚠️ 需要至少2个PDF文件才能进行合并</div>';
    }
});

document.getElementById('merge-button').addEventListener('click', async () => {
    const progress = document.getElementById('progress');
    progress.innerHTML = '<div class="processing-message">⏳ 正在处理中...</div>';
    
    try {
        const PDFLib = window.PDFLib;
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        // 依次处理每个PDF文件
        for (let i = 0; i < selectedFiles.length; i++) {
            try {
                // 加载PDF文件
                const pdfBytes = await selectedFiles[i].arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(pdfBytes);
                
                // 检查PDF是否有页面
                if (pdf.getPageCount() === 0) {
                    throw new Error(`文件 "${selectedFiles[i].name}" 是空的PDF文件`);
                }
                
                // 复制所有页面
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // 将页面添加到合并后的文档中
                pages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
                
                // 更新进度
                progress.innerHTML = `<div class="processing-message">⏳ 正在处理中...(${i + 1}/${selectedFiles.length})</div>`;
            } catch (error) {
                throw new Error(`处理文件 "${selectedFiles[i].name}" 时出错: ${error.message}`);
            }
        }
        
        // 保存合并后的PDF
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // 下载文件
        const a = document.createElement('a');
        a.href = url;
        a.download = '合并后的PDF.pdf';
        a.click();
        
        URL.revokeObjectURL(url);
        progress.innerHTML = '<div class="success-message">✅ 合并完成！</div>';
    } catch (error) {
        console.error('PDF处理错误:', error);
        progress.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
    }
});

// 文件大小格式化函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 