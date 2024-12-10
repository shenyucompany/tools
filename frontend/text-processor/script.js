document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const inputText = document.getElementById('input-text');
    const searchText = document.getElementById('search-text');
    const replaceText = document.getElementById('replace-text');
    const replaceBtn = document.getElementById('replace-btn');
    const replaceAllBtn = document.getElementById('replace-all-btn');
    const uppercaseBtn = document.getElementById('uppercase-btn');
    const lowercaseBtn = document.getElementById('lowercase-btn');
    const capitalizeBtn = document.getElementById('capitalize-btn');
    const trimSpacesBtn = document.getElementById('trim-spaces-btn');
    const removeEmptyLinesBtn = document.getElementById('remove-empty-lines-btn');
    const removeDuplicatesBtn = document.getElementById('remove-duplicates-btn');
    const sortLinesBtn = document.getElementById('sort-lines-btn');
    const addLineNumbersBtn = document.getElementById('add-line-numbers-btn');
    const removeLineNumbersBtn = document.getElementById('remove-line-numbers-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');

    // 查找替换功能
    replaceBtn.addEventListener('click', () => {
        const search = searchText.value;
        const replace = replaceText.value;
        if (!search) return;

        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            // 替换选中文本
            const start = inputText.selectionStart;
            const end = inputText.selectionEnd;
            const text = inputText.value;
            inputText.value = text.substring(0, start) + 
                            selectedText.replace(search, replace) + 
                            text.substring(end);
        } else {
            // 替换第一个匹配项
            inputText.value = inputText.value.replace(search, replace);
        }
    });

    replaceAllBtn.addEventListener('click', () => {
        const search = searchText.value;
        const replace = replaceText.value;
        if (!search) return;

        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            // 替换选中文本中的所有匹配项
            const start = inputText.selectionStart;
            const end = inputText.selectionEnd;
            const text = inputText.value;
            inputText.value = text.substring(0, start) + 
                            selectedText.replace(new RegExp(search, 'g'), replace) + 
                            text.substring(end);
        } else {
            // 替换所有匹配项
            inputText.value = inputText.value.replace(new RegExp(search, 'g'), replace);
        }
    });

    // 大小写转换功能
    uppercaseBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            // 转换选中文本
            const start = inputText.selectionStart;
            const end = inputText.selectionEnd;
            const text = inputText.value;
            inputText.value = text.substring(0, start) + 
                            selectedText.toUpperCase() + 
                            text.substring(end);
        } else {
            // 转换全部文本
            inputText.value = inputText.value.toUpperCase();
        }
    });

    lowercaseBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            // 转换选中文本
            const start = inputText.selectionStart;
            const end = inputText.selectionEnd;
            const text = inputText.value;
            inputText.value = text.substring(0, start) + 
                            selectedText.toLowerCase() + 
                            text.substring(end);
        } else {
            // 转换全部文本
            inputText.value = inputText.value.toLowerCase();
        }
    });

    capitalizeBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            // 转换选中文本
            const start = inputText.selectionStart;
            const end = inputText.selectionEnd;
            const text = inputText.value;
            inputText.value = text.substring(0, start) + 
                            capitalizeText(selectedText) + 
                            text.substring(end);
        } else {
            // 转换全部文本
            inputText.value = capitalizeText(inputText.value);
        }
    });

    // 空白处理功能
    trimSpacesBtn.addEventListener('click', () => {
        // 去除多余空格
        inputText.value = inputText.value
            .split('\n')
            .map(line => line.trim().replace(/\s+/g, ' '))
            .join('\n');
    });

    removeEmptyLinesBtn.addEventListener('click', () => {
        // 去除空行
        inputText.value = inputText.value
            .split('\n')
            .filter(line => line.trim())
            .join('\n');
    });

    // 行处理功能
    removeDuplicatesBtn.addEventListener('click', () => {
        // 删除重复行
        const lines = inputText.value.split('\n');
        const uniqueLines = [...new Set(lines)];
        inputText.value = uniqueLines.join('\n');
    });

    sortLinesBtn.addEventListener('click', () => {
        // 文本排序
        const lines = inputText.value.split('\n');
        lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        inputText.value = lines.join('\n');
    });

    addLineNumbersBtn.addEventListener('click', () => {
        // 添加行号
        const lines = inputText.value.split('\n');
        const numberedLines = lines.map((line, index) => 
            `${(index + 1).toString().padStart(4, ' ')}. ${line}`
        );
        inputText.value = numberedLines.join('\n');
    });

    removeLineNumbersBtn.addEventListener('click', () => {
        // 删除行号
        const lines = inputText.value.split('\n');
        const cleanLines = lines.map(line => 
            line.replace(/^\s*\d+\.\s*/, '')
        );
        inputText.value = cleanLines.join('\n');
    });

    // 复制和清空功能
    copyBtn.addEventListener('click', () => {
        inputText.select();
        document.execCommand('copy');
        alert('文本已复制到剪贴板！');
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有文本吗？')) {
            inputText.value = '';
        }
    });

    // 辅助函数：首字母大写
    function capitalizeText(text) {
        return text
            .split('\n')
            .map(line => 
                line.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
            )
            .join('\n');
    }
}); 