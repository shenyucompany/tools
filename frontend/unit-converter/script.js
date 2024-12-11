document.addEventListener('DOMContentLoaded', function() {
    // 单位类型定义
    const unitTypes = {
        length: {
            m: { name: '米', ratio: 1 },
            km: { name: '千米', ratio: 1000 },
            cm: { name: '厘米', ratio: 0.01 },
            mm: { name: '毫米', ratio: 0.001 },
            inch: { name: '英寸', ratio: 0.0254 },
            ft: { name: '英尺', ratio: 0.3048 },
            yd: { name: '码', ratio: 0.9144 },
            mi: { name: '英里', ratio: 1609.344 }
        },
        weight: {
            kg: { name: '千克', ratio: 1 },
            g: { name: '克', ratio: 0.001 },
            mg: { name: '毫克', ratio: 0.000001 },
            t: { name: '吨', ratio: 1000 },
            lb: { name: '磅', ratio: 0.4536 },
            oz: { name: '盎司', ratio: 0.02835 }
        },
        area: {
            m2: { name: '平方米', ratio: 1 },
            km2: { name: '平方千米', ratio: 1000000 },
            cm2: { name: '平方厘米', ratio: 0.0001 },
            mm2: { name: '平方毫米', ratio: 0.000001 },
            ha: { name: '公顷', ratio: 10000 },
            acre: { name: '英亩', ratio: 4046.86 }
        },
        volume: {
            m3: { name: '立方米', ratio: 1 },
            L: { name: '升', ratio: 0.001 },
            mL: { name: '毫升', ratio: 0.000001 },
            cm3: { name: '立方厘米', ratio: 0.000001 },
            gal: { name: '加仑', ratio: 0.003785 }
        }
    };

    // DOM 元素
    const typeButtons = document.querySelectorAll('.type-btn');
    const unitValue = document.getElementById('unit-value');
    const unitFrom = document.getElementById('unit-from');
    const unitTo = document.getElementById('unit-to');
    const unitResult = document.getElementById('unit-result');
    const conversionTable = document.getElementById('conversion-table');

    // 当前选中的单位类型
    let currentType = 'length';

    // 更新单位选择器选项
    function updateUnitOptions() {
        const units = unitTypes[currentType];
        
        unitFrom.innerHTML = '';
        unitTo.innerHTML = '';
        
        Object.entries(units).forEach(([key, unit]) => {
            unitFrom.add(new Option(`${unit.name} (${key})`, key));
            unitTo.add(new Option(`${unit.name} (${key})`, key));
        });
        
        // 默认选择第一个和第二个选项
        unitTo.selectedIndex = 1;
        
        // 更新换算表
        updateConversionTable();
        // 执行转换
        convertUnit();
    }

    // 更新常用换算表
    function updateConversionTable() {
        const units = unitTypes[currentType];
        const baseUnit = Object.entries(units)[0];
        const rows = Object.entries(units).slice(1, 4).map(([key, unit]) => {
            const ratio = unit.ratio / baseUnit[1].ratio;
            return `
                <div class="conversion-row">
                    <span class="conversion-from">1 ${unit.name}</span>
                    <span class="conversion-equals">=</span>
                    <span class="conversion-to">${ratio.toFixed(4)} ${baseUnit[1].name}</span>
                </div>
            `;
        });
        
        conversionTable.innerHTML = rows.join('');
    }

    // 单位转换计算
    function convertUnit() {
        const value = parseFloat(unitValue.value) || 0;
        const fromUnit = unitTypes[currentType][unitFrom.value];
        const toUnit = unitTypes[currentType][unitTo.value];
        
        const result = value * fromUnit.ratio / toUnit.ratio;
        unitResult.value = result.toFixed(6);
    }

    // 事件监听
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新按钮状态
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新当前类型
            currentType = btn.dataset.type;
            
            // 更新选项和换算表
            updateUnitOptions();
        });
    });

    unitValue.addEventListener('input', convertUnit);
    unitFrom.addEventListener('change', convertUnit);
    unitTo.addEventListener('change', convertUnit);

    // 初始化
    updateUnitOptions();
}); 