document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素
    const inputText = document.getElementById('input-text');
    const pasteBtn = document.getElementById('paste-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fileInput = document.getElementById('file-input');

    // 基础统计元素
    const totalChars = document.getElementById('total-chars');
    const charsNoSpaces = document.getElementById('chars-no-spaces');
    const wordCount = document.getElementById('word-count');
    const lineCount = document.getElementById('line-count');
    const paragraphCount = document.getElementById('paragraph-count');
    const sentenceCount = document.getElementById('sentence-count');

    // 语言分析元素
    const chineseChars = document.getElementById('chinese-chars');
    const englishWords = document.getElementById('english-words');
    const numberCount = document.getElementById('number-count');
    const punctuationCount = document.getElementById('punctuation-count');

    // 词频统计元素
    const frequencyType = document.getElementById('frequency-type');
    const topN = document.getElementById('top-n');
    const updateFrequencyBtn = document.getElementById('update-frequency');
    const frequencyList = document.getElementById('frequency-list');

    // 文本特征元素
    const avgWordLength = document.getElementById('avg-word-length');
    const avgSentenceLength = document.getElementById('avg-sentence-length');
    const lexicalDensity = document.getElementById('lexical-density');

    // 基础功能
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            analyzeText();
        } catch (err) {
            alert('无法访问剪贴板');
        }
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空文本吗？')) {
            inputText.value = '';
            analyzeText();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            inputText.value = e.target.result;
            analyzeText();
        };
        reader.readAsText(file);
    });

    // 文本分析功能
    function analyzeText() {
        const text = inputText.value;

        // 基础统计
        totalChars.textContent = text.length;
        charsNoSpaces.textContent = text.replace(/\s/g, '').length;
        wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
        lineCount.textContent = text.trim() ? text.trim().split('\n').length : 0;
        paragraphCount.textContent = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
        sentenceCount.textContent = text.trim() ? text.split(/[.!?。！？]+/).length - 1 : 0;

        // 语言分析
        chineseChars.textContent = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        englishWords.textContent = (text.match(/[a-zA-Z]+/g) || []).length;
        numberCount.textContent = (text.match(/\d+/g) || []).length;
        punctuationCount.textContent = (text.match(/[,.!?;:'"。，！？；：""'']/g) || []).length;

        // 文本特征
        const words = text.trim().split(/\s+/);
        const avgWordLen = words.length ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
        avgWordLength.textContent = avgWordLen.toFixed(2);

        const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim());
        const avgSentLen = sentences.length ? words.length / sentences.length : 0;
        avgSentenceLength.textContent = avgSentLen.toFixed(2);

        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const density = words.length ? (uniqueWords.size / words.length * 100) : 0;
        lexicalDensity.textContent = density.toFixed(2) + '%';

        // 更新词频统计
        updateFrequency();
    }

    // 词频统计功能
    function updateFrequency() {
        const text = inputText.value;
        const type = frequencyType.value;
        const n = parseInt(topN.value);

        let words;
        if (type === 'chinese') {
            // 中文分词（简单实现，实际应使用分词库）
            words = text.match(/[\u4e00-\u9fa5]+/g) || [];
        } else if (type === 'english') {
            words = text.match(/[a-zA-Z]+/g) || [];
        } else {
            words = text.trim().split(/\s+/);
        }

        // 统计词频
        const frequency = {};
        words.forEach(word => {
            word = word.toLowerCase();
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // 排序并取前N个
        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n);

        // 显示结果
        frequencyList.innerHTML = sorted
            .map(([word, count]) => `
                <div class="frequency-item">
                    <span class="frequency-word">${word}</span>
                    <span class="frequency-count">${count}</span>
                </div>
            `)
            .join('');
    }

    // 监听文本输入
    inputText.addEventListener('input', analyzeText);

    // 监听词频设置变化
    frequencyType.addEventListener('change', updateFrequency);
    topN.addEventListener('change', updateFrequency);
    updateFrequencyBtn.addEventListener('click', updateFrequency);

    // 初始分析
    analyzeText();
}); 