document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const amount = document.getElementById('amount');
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const result = document.getElementById('result');
    const swapBtn = document.getElementById('swap-currency');
    const exchangeRate = document.getElementById('exchange-rate');
    const updateTime = document.getElementById('update-time');
    const rateTable = document.getElementById('rate-table');

    // 汇率数据（模拟实时数据）
    const rates = {
        'CNY': { 'USD': 0.1389, 'EUR': 0.1277, 'GBP': 0.1093, 'JPY': 16.35, 'KRW': 184.27, 'HKD': 1.0851 },
        'USD': { 'CNY': 7.1994, 'EUR': 0.9193, 'GBP': 0.7868, 'JPY': 117.71, 'KRW': 1326.63, 'HKD': 7.8123 },
        'EUR': { 'CNY': 7.8315, 'USD': 1.0879, 'GBP': 0.8559, 'JPY': 128.04, 'KRW': 1443.07, 'HKD': 8.4975 },
        'GBP': { 'CNY': 9.1502, 'USD': 1.2711, 'EUR': 1.1683, 'JPY': 149.60, 'KRW': 1686.01, 'HKD': 9.9289 },
        'JPY': { 'CNY': 0.0612, 'USD': 0.0085, 'EUR': 0.0078, 'GBP': 0.0067, 'KRW': 11.27, 'HKD': 0.0664 },
        'KRW': { 'CNY': 0.0054, 'USD': 0.0008, 'EUR': 0.0007, 'GBP': 0.0006, 'JPY': 0.0887, 'HKD': 0.0059 },
        'HKD': { 'CNY': 0.9216, 'USD': 0.1280, 'EUR': 0.1177, 'GBP': 0.1007, 'JPY': 15.07, 'KRW': 169.81 }
    };

    // 更新汇率显示
    function updateExchangeRateDisplay() {
        const from = fromCurrency.value;
        const to = toCurrency.value;
        const rate = rates[from][to];
        exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    }

    // 更新常用汇率表
    function updateRateTable() {
        const baseCurrency = fromCurrency.value;
        const rows = Object.entries(rates[baseCurrency])
            .map(([currency, rate]) => `
                <div class="rate-item">
                    <span class="rate-currency">${baseCurrency} → ${currency}</span>
                    <span class="rate-value">${rate.toFixed(4)}</span>
                </div>
            `)
            .join('');
        
        rateTable.innerHTML = rows;
    }

    // 转换货币
    function convertCurrency() {
        const value = parseFloat(amount.value) || 0;
        const from = fromCurrency.value;
        const to = toCurrency.value;
        
        if (from === to) {
            result.value = value;
        } else {
            const rate = rates[from][to];
            result.value = (value * rate).toFixed(2);
        }
        
        updateExchangeRateDisplay();
        updateRateTable();
    }

    // 交换货币
    function swapCurrencies() {
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        
        convertCurrency();
    }

    // 更新时间显示
    function updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        updateTime.textContent = now.toLocaleString('zh-CN', options);
    }

    // 事件监听
    amount.addEventListener('input', convertCurrency);
    fromCurrency.addEventListener('change', convertCurrency);
    toCurrency.addEventListener('change', convertCurrency);
    swapBtn.addEventListener('click', swapCurrencies);

    // 初始化
    updateDateTime();
    convertCurrency();

    // 定时更新时间（模拟实时数据更新）
    setInterval(updateDateTime, 60000);
}); 