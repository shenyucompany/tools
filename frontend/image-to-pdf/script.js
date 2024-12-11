document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.querySelector('.upload-area');
    const convertBtn = document.getElementById('convert-button');
    const progress = document.getElementById('progress');
    let selectedFiles = [];

    // API基础URL
    const API_BASE_URL = window.location.hostname === 'qinlipdf.netlify.app' 
        ? 'https://tools-as5l.onrender.com'  // 生产环境
        : 'http://localhost:8000';           // 开发环境

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

            // 创建FormData对象
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // 发送请求到后端
            const response = await fetch(`${API_BASE_URL}/api/image/to-pdf`, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit',  // 不发送cookies
                headers: {
                    'Accept': 'application/pdf',
                    'Origin': window.location.origin,
                }
            });

            if (!response.ok) {
                throw new Error('转换失败');
            }

            // 获取转换后的PDF文件
            const pdfBlob = await response.blob();
            const url = URL.createObjectURL(pdfBlob);
            
            // 下载文件
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted_with_ocr.pdf';
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