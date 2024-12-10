document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const inputText = document.getElementById('input-text');
    const outputContent = document.getElementById('output-content');
    const pasteBtn = document.getElementById('paste-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fileInput = document.getElementById('file-input');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    // 编码转换相关
    const inputEncoding = document.getElementById('input-encoding');
    const outputEncoding = document.getElementById('output-encoding');

    // 换行符转换相关
    const newlineFormat = document.getElementById('newline-format');

    // 格式化按钮
    const formatHtmlBtn = document.getElementById('format-html');
    const formatXmlBtn = document.getElementById('format-xml');
    const formatJsonBtn = document.getElementById('format-json');
    const formatCssBtn = document.getElementById('format-css');
    const formatJsBtn = document.getElementById('format-js');

    // Markdown相关
    const mdToHtmlBtn = document.getElementById('md-to-html');
    const mdPreviewBtn = document.getElementById('md-preview');

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

    copyBtn.addEventListener('click', () => {
        const text = outputContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('已复制到剪贴板！');
        });
    });

    downloadBtn.addEventListener('click', () => {
        const text = outputContent.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 编码转换
    [inputEncoding, outputEncoding].forEach(select => {
        select.addEventListener('change', () => {
            const text = inputText.value;
            if (!text) {
                outputContent.textContent = '';
                return;
            }

            try {
                // 这里需要后端支持，前端无法直接处理编码转换
                convertEncoding(text, inputEncoding.value, outputEncoding.value);
            } catch (error) {
                console.error('编码转换失败：', error);
            }
        });
    });

    // 换行符转换
    newlineFormat.addEventListener('change', () => {
        const text = inputText.value;
        if (!text) return;

        const format = newlineFormat.value;
        let result = text;

        // 先统一转换为LF
        result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 然后转换为目标格式
        switch (format) {
            case 'CRLF':
                result = result.replace(/\n/g, '\r\n');
                break;
            case 'CR':
                result = result.replace(/\n/g, '\r');
                break;
            // LF不需要转换
        }

        outputContent.textContent = result;
    });

    // 检查输出内容是否需要水平滚动
    function checkOutputOverflow() {
        const hasOverflow = outputContent.scrollWidth > outputContent.clientWidth;
        outputContent.classList.toggle('has-overflow', hasOverflow);
    }

    // 在内容变化时检查是否需要显示滚动指示器
    const observer = new MutationObserver(checkOutputOverflow);
    observer.observe(outputContent, {
        childList: true,
        characterData: true,
        subtree: true
    });

    // 在窗口大小改变时也检查
    window.addEventListener('resize', checkOutputOverflow);

    // 格式化功能
    formatHtmlBtn.addEventListener('click', () => {
        try {
            const formatted = prettier.format(inputText.value, {
                parser: 'html',
                plugins: prettierPlugins,
                printWidth: 80,
                tabWidth: 2
            });
            outputContent.textContent = formatted;
            checkOutputOverflow();
        } catch (error) {
            alert('HTML格式化失败：' + error.message);
        }
    });

    formatXmlBtn.addEventListener('click', () => {
        try {
            const formatted = prettier.format(inputText.value, {
                parser: 'html',
                plugins: prettierPlugins,
                printWidth: 80,
                tabWidth: 2
            });
            outputContent.textContent = formatted;
            checkOutputOverflow();
        } catch (error) {
            alert('XML格式化失败：' + error.message);
        }
    });

    formatJsonBtn.addEventListener('click', () => {
        try {
            const obj = JSON.parse(inputText.value);
            const formatted = JSON.stringify(obj, null, 2);
            outputContent.textContent = formatted;
            checkOutputOverflow();
        } catch (error) {
            alert('JSON格式化失败：' + error.message);
        }
    });

    formatCssBtn.addEventListener('click', () => {
        try {
            const formatted = prettier.format(inputText.value, {
                parser: 'css',
                plugins: prettierPlugins,
                printWidth: 80,
                tabWidth: 2
            });
            outputContent.textContent = formatted;
            checkOutputOverflow();
        } catch (error) {
            alert('CSS格式化失败：' + error.message);
        }
    });

    formatJsBtn.addEventListener('click', () => {
        try {
            const formatted = prettier.format(inputText.value, {
                parser: 'babel',
                plugins: prettierPlugins,
                printWidth: 80,
                tabWidth: 2,
                semi: true,
                singleQuote: true
            });
            outputContent.textContent = formatted;
            checkOutputOverflow();
        } catch (error) {
            alert('JavaScript格式化失败：' + error.message);
        }
    });

    // Markdown转换
    mdToHtmlBtn.addEventListener('click', () => {
        try {
            const html = marked.parse(inputText.value);
            outputContent.innerHTML = html;
        } catch (error) {
            alert('Markdown转换失败：' + error.message);
        }
    });

    mdPreviewBtn.addEventListener('click', () => {
        try {
            const html = marked.parse(inputText.value);
            // 创建预览窗口
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Markdown预览</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                            line-height: 1.6;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        img { max-width: 100%; }
                        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                        code { font-family: Consolas, Monaco, 'Andale Mono', monospace; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            previewWindow.document.close();
        } catch (error) {
            alert('预览失败：' + error.message);
        }
    });

    // 编码转换函数（需要后端支持）
    async function convertEncoding(text, fromEncoding, toEncoding) {
        try {
            const response = await fetch('http://localhost:8000/api/format/convert-encoding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    from_encoding: fromEncoding,
                    to_encoding: toEncoding
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '转换失败');
            }

            const result = await response.json();
            outputContent.textContent = result.text;
            checkOutputOverflow();
        } catch (error) {
            console.error('编码转换失败：', error);
            outputContent.textContent = text;  // 如果转换失败，显示原文
        }
    }
}); 