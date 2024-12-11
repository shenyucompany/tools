document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const inputText = document.getElementById('input-text');
    const outputContent = document.getElementById('output-content');
    const pasteBtn = document.getElementById('paste-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fileInput = document.getElementById('file-input');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Base64 按钮
    const base64EncodeBtn = document.getElementById('base64-encode');
    const base64DecodeBtn = document.getElementById('base64-decode');
    // URL 按钮
    const urlEncodeBtn = document.getElementById('url-encode');
    const urlDecodeBtn = document.getElementById('url-decode');
    // HTML实体 按钮
    const htmlEncodeBtn = document.getElementById('html-encode');
    const htmlDecodeBtn = document.getElementById('html-decode');

    // 格式切换功能
    const formatItems = document.querySelectorAll('.format-item');

    formatItems.forEach(item => {
        item.addEventListener('click', () => {
            const format = item.dataset.format;

            // 更新选中状态
            formatItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 基础功能
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
        } catch (err) {
            alert('无法访问剪贴板');
        }
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空文本吗？')) {
            inputText.value = '';
            outputContent.textContent = '';
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            inputText.value = e.target.result;
        };
        reader.readAsText(file);
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(outputContent.textContent);
            alert('已复制到剪贴板');
        } catch (err) {
            alert('复制失败');
        }
    });

    downloadBtn.addEventListener('click', () => {
        const text = outputContent.textContent;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Base64 编解码
    base64EncodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const encoded = btoa(unescape(encodeURIComponent(text)));
            outputContent.textContent = encoded;
        } catch (error) {
            alert('Base64编码失败：' + error.message);
        }
    });

    base64DecodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const decoded = decodeURIComponent(escape(atob(text)));
            outputContent.textContent = decoded;
        } catch (error) {
            alert('Base64解码失败：' + error.message);
        }
    });

    // URL 编解码
    urlEncodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const encoded = encodeURIComponent(text);
            outputContent.textContent = encoded;
        } catch (error) {
            alert('URL编码失败：' + error.message);
        }
    });

    urlDecodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const decoded = decodeURIComponent(text);
            outputContent.textContent = decoded;
        } catch (error) {
            alert('URL解码失败：' + error.message);
        }
    });

    // HTML实体编解码
    htmlEncodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const div = document.createElement('div');
            div.textContent = text;
            outputContent.textContent = div.innerHTML;
        } catch (error) {
            alert('HTML实体编码失败：' + error.message);
        }
    });

    htmlDecodeBtn.addEventListener('click', () => {
        try {
            const text = inputText.value;
            const div = document.createElement('div');
            div.innerHTML = text;
            outputContent.textContent = div.textContent;
        } catch (error) {
            alert('HTML实体解码失败：' + error.message);
        }
    });
}); 