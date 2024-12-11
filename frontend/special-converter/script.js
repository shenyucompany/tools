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

    // 度量衡转换单位定义
    const unitTypes = {
        length: {
            m: { name: '米', ratio: 1 },
            km: { name: '千米', ratio: 1000 },
            cm: { name: '厘米', ratio: 0.01 },
            mm: { name: '毫米', ratio: 0.001 },
            inch: { name: '英寸', ratio: 0.0254 },
            ft: { name: '英尺', ratio: 0.3048 }
        },
        weight: {
            kg: { name: '千克', ratio: 1 },
            g: { name: '克', ratio: 0.001 },
            mg: { name: '毫克', ratio: 0.000001 },
            lb: { name: '磅', ratio: 0.4536 },
            oz: { name: '盎司', ratio: 0.02835 }
        },
        area: {
            m2: { name: '平方米', ratio: 1 },
            km2: { name: '平方千米', ratio: 1000000 },
            cm2: { name: '平方厘米', ratio: 0.0001 },
            ha: { name: '公顷', ratio: 10000 }
        },
        volume: {
            m3: { name: '立方米', ratio: 1 },
            L: { name: '升', ratio: 0.001 },
            mL: { name: '毫升', ratio: 0.000001 },
            gal: { name: '加仑', ratio: 0.003785 }
        }
    };

    // 度量衡转换功能
    const unitType = document.getElementById('unit-type');
    const unitValue = document.getElementById('unit-value');
    const unitFrom = document.getElementById('unit-from');
    const unitTo = document.getElementById('unit-to');
    const unitResult = document.getElementById('unit-result');

    function updateUnitOptions() {
        const type = unitType.value;
        const units = unitTypes[type];
        
        unitFrom.innerHTML = '';
        unitTo.innerHTML = '';
        
        Object.entries(units).forEach(([key, unit]) => {
            unitFrom.add(new Option(`${unit.name} (${key})`, key));
            unitTo.add(new Option(`${unit.name} (${key})`, key));
        });
        
        convertUnit();
    }

    function convertUnit() {
        const type = unitType.value;
        const value = parseFloat(unitValue.value) || 0;
        const fromUnit = unitTypes[type][unitFrom.value];
        const toUnit = unitTypes[type][unitTo.value];
        
        const result = value * fromUnit.ratio / toUnit.ratio;
        unitResult.value = result.toFixed(6);
    }

    unitType.addEventListener('change', updateUnitOptions);
    unitValue.addEventListener('input', convertUnit);
    unitFrom.addEventListener('change', convertUnit);
    unitTo.addEventListener('change', convertUnit);

    // 货币转换功能
    const currencyAmount = document.getElementById('currency-amount');
    const currencyFrom = document.getElementById('currency-from');
    const currencyTo = document.getElementById('currency-to');
    const currencyResult = document.getElementById('currency-result');

    async function convertCurrency() {
        try {
            const amount = parseFloat(currencyAmount.value) || 0;
            const from = currencyFrom.value;
            const to = currencyTo.value;
            
            // 这里应该使用实际的汇率API，这里使用模拟数据
            const rates = {
                'CNY': { 'USD': 0.15, 'EUR': 0.13, 'JPY': 16.5 },
                'USD': { 'CNY': 6.67, 'EUR': 0.85, 'JPY': 110 },
                'EUR': { 'CNY': 7.85, 'USD': 1.18, 'JPY': 129.5 },
                'JPY': { 'CNY': 0.061, 'USD': 0.009, 'EUR': 0.0077 }
            };
            
            if (from === to) {
                currencyResult.value = amount;
            } else {
                const rate = rates[from][to];
                currencyResult.value = (amount * rate).toFixed(2);
            }
        } catch (error) {
            alert('货币转换失败');
        }
    }

    currencyAmount.addEventListener('input', convertCurrency);
    currencyFrom.addEventListener('change', convertCurrency);
    currencyTo.addEventListener('change', convertCurrency);

    // 时区转换功能
    const timezoneTime = document.getElementById('timezone-time');
    const timezoneFrom = document.getElementById('timezone-from');
    const timezoneResults = document.getElementById('timezone-results');

    function convertTimezone() {
        try {
            const date = new Date(timezoneTime.value);
            if (isNaN(date)) return;
            
            const fromZone = timezoneFrom.value;
            const targetZones = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
            
            const results = targetZones.map(zone => {
                const options = {
                    timeZone: zone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };
                
                return {
                    zone: zone,
                    time: date.toLocaleString('zh-CN', options)
                };
            });
            
            timezoneResults.innerHTML = results.map(result => `
                <div class="timezone-result-item">
                    <span>${getTimezoneName(result.zone)}</span>
                    <span>${result.time}</span>
                </div>
            `).join('');
        } catch (error) {
            alert('时区转换失败');
        }
    }

    function getTimezoneName(zone) {
        const names = {
            'Asia/Shanghai': '北京',
            'America/New_York': '纽约',
            'Europe/London': '伦敦',
            'Asia/Tokyo': '东京'
        };
        return names[zone] || zone;
    }

    timezoneTime.addEventListener('input', convertTimezone);
    timezoneFrom.addEventListener('change', convertTimezone);

    // 初始化
    updateUnitOptions();
}); 