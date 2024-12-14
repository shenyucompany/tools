document.addEventListener('DOMContentLoaded', function() {
    const timestampInput = document.getElementById('timestamp-input');
    const timestampUnit = document.getElementById('timestamp-unit');
    const datetimeInput = document.getElementById('datetime-input');
    const toDatetimeBtn = document.getElementById('to-datetime-btn');
    const toTimestampBtn = document.getElementById('to-timestamp-btn');
    const datetimeResult = document.getElementById('datetime-result');
    const timestampResult = document.getElementById('timestamp-result');
    const currentDatetime = document.getElementById('current-datetime');
    const currentTimestamp = document.getElementById('current-timestamp');

    // 更新当前时间显示
    function updateCurrentTime() {
        const now = new Date();
        currentDatetime.textContent = now.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });
        currentTimestamp.textContent = `时间戳：${Math.floor(now.getTime() / 1000)}`;
    }

    // 初始化当前时间并每秒更新
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 时间戳转北京时间
    toDatetimeBtn.addEventListener('click', function() {
        const timestamp = timestampInput.value;
        if (!timestamp) {
            datetimeResult.textContent = '请输入时间戳';
            return;
        }

        try {
            let ms = timestamp;
            if (timestampUnit.value === 's') {
                ms = timestamp * 1000;
            }
            const date = new Date(Number(ms));
            datetimeResult.textContent = date.toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false
            });
        } catch (e) {
            datetimeResult.textContent = '转换失败，请检查输入';
        }
    });

    // 北京时间转时间戳
    toTimestampBtn.addEventListener('click', function() {
        const datetime = datetimeInput.value;
        if (!datetime) {
            timestampResult.textContent = '请选择时间';
            return;
        }

        try {
            const date = new Date(datetime);
            const timestamp = Math.floor(date.getTime() / 1000);
            timestampResult.innerHTML = `
                秒级时间戳：${timestamp}<br>
                毫秒级时间戳：${date.getTime()}
            `;
        } catch (e) {
            timestampResult.textContent = '转换失败，请检查输入';
        }
    });

    // 设置datetime-local输入框的默认值为当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}); 