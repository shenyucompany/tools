document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const sourceTime = document.getElementById('source-time');
    const sourceTimezone = document.getElementById('source-timezone');
    const timeList = document.getElementById('time-list');

    // 时区数据
    const timezones = [
        { id: 'Asia/Shanghai', name: '北京', offset: '+0800' },
        { id: 'America/New_York', name: '纽约', offset: '-0400' },
        { id: 'Europe/London', name: '伦敦', offset: '+0100' },
        { id: 'Asia/Tokyo', name: '东京', offset: '+0900' },
        { id: 'Europe/Paris', name: '巴黎', offset: '+0200' },
        { id: 'Australia/Sydney', name: '悉尼', offset: '+1000' },
        { id: 'Asia/Dubai', name: '迪拜', offset: '+0400' },
        { id: 'Asia/Singapore', name: '新加坡', offset: '+0800' },
        { id: 'America/Los_Angeles', name: '洛杉矶', offset: '-0700' },
        { id: 'America/Chicago', name: '芝加哥', offset: '-0500' },
        { id: 'Europe/Berlin', name: '柏林', offset: '+0200' },
        { id: 'Europe/Moscow', name: '莫斯科', offset: '+0300' }
    ];

    // 设置默认时间为当前时间
    function setDefaultTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        sourceTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // 转换时区时间
    function convertTime() {
        const sourceDate = new Date(sourceTime.value);
        if (isNaN(sourceDate)) return;

        const sourceOffset = getTimezoneOffset(sourceTimezone.value);
        const sourceUTC = new Date(sourceDate.getTime() - sourceOffset * 60000);

        const results = timezones.map(timezone => {
            const targetOffset = getTimezoneOffset(timezone.id);
            const targetTime = new Date(sourceUTC.getTime() + targetOffset * 60000);
            
            return {
                location: timezone.name,
                time: formatDateTime(targetTime),
                offset: timezone.offset
            };
        });

        displayResults(results);
    }

    // 获取时区偏移量（分钟）
    function getTimezoneOffset(timezoneId) {
        const timezone = timezones.find(tz => tz.id === timezoneId);
        if (!timezone) return 0;

        const offset = timezone.offset;
        const hours = parseInt(offset.substring(1, 3));
        const minutes = parseInt(offset.substring(3));
        const multiplier = offset.charAt(0) === '+' ? 1 : -1;

        return multiplier * (hours * 60 + minutes);
    }

    // 格式化日期时间
    function formatDateTime(date) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleString('zh-CN', options);
    }

    // 显示转换结果
    function displayResults(results) {
        const html = results.map(result => `
            <div class="time-item">
                <span class="time-location">${result.location} (UTC${result.offset})</span>
                <span class="time-value">${result.time}</span>
            </div>
        `).join('');

        timeList.innerHTML = html;
    }

    // 事件监听
    sourceTime.addEventListener('change', convertTime);
    sourceTimezone.addEventListener('change', convertTime);

    // 初始化
    setDefaultTime();
    convertTime();
}); 