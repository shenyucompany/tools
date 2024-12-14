document.addEventListener('DOMContentLoaded', function() {
    const lengthSlider = document.getElementById('length-slider');
    const lengthValue = document.getElementById('length-value');
    const generateBtn = document.getElementById('generate-btn');
    const passwordOutput = document.getElementById('password-output');
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');

    // 更新密码长度显示
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    // 生成密码
    generateBtn.addEventListener('click', function() {
        const length = parseInt(lengthSlider.value);
        const useNumbers = document.getElementById('numbers').checked;
        const useLowercase = document.getElementById('lowercase').checked;
        const useUppercase = document.getElementById('uppercase').checked;
        const useSymbols = document.getElementById('symbols').checked;

        const password = generatePassword(length, useNumbers, useLowercase, useUppercase, useSymbols);
        passwordOutput.value = password;

        // 添加到历史记录
        addToHistory(password);
    });

    // 复制密码
    copyBtn.addEventListener('click', function() {
        passwordOutput.select();
        document.execCommand('copy');
        
        // 显示复制成功提示
        const originalTitle = copyBtn.title;
        copyBtn.title = '已复制！';
        setTimeout(() => {
            copyBtn.title = originalTitle;
        }, 1500);
    });

    // 生成密码函数
    function generatePassword(length, numbers, lowercase, uppercase, symbols) {
        let chars = '';
        if (numbers) chars += '0123456789';
        if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (symbols) chars += '~!@#$%^&*()_+';

        if (!chars) {
            alert('请至少选择一种字符类型');
            return '';
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return password;
    }

    // 添加到历史记录
    function addToHistory(password) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="history-password">${password}</span>
            <span class="history-time">${time}</span>
        `;

        historyList.insertBefore(historyItem, historyList.firstChild);

        // 限制历史记录数量
        if (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastChild);
        }

        // 保存到本地存储
        saveToLocalStorage(password, time);
    }

    // 保存到本地存储
    function saveToLocalStorage(password, time) {
        const history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        history.unshift({ password, time });
        
        // 限制存储数量
        if (history.length > 5) {
            history.pop();
        }
        
        localStorage.setItem('passwordHistory', JSON.stringify(history));
    }

    // 加载历史记录
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-password">${item.password}</span>
                <span class="history-time">${item.time}</span>
            `;
            historyList.appendChild(historyItem);
        });
    }

    // 初始化加载历史记录
    loadHistory();
}); 