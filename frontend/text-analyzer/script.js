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
    const sentimentScore = document.getElementById('sentiment-score');
    const subjectivityScore = document.getElementById('subjectivity-score');
    const readabilityScore = document.getElementById('readability-score');
    const posDistribution = document.getElementById('pos-distribution');
    const styleAnalysis = document.getElementById('style-analysis');
    const keywords = document.getElementById('keywords');

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
        if (!text.trim()) {
            resetAnalysis();
            return;
        }

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

        // 情感分析
        analyzeSentiment(text);
        
        // 主观性分析
        analyzeSubjectivity(text);
        
        // 可读性分析
        analyzeReadability(text);
        
        // 词性分析
        analyzePOS(text);
        
        // 风格分析
        analyzeStyle(text);
        
        // 关键词提取
        extractKeywords(text);
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

    // 情感分析
    function analyzeSentiment(text) {
        // 简单的情感词典
        const positiveWords = new Set(['好', '棒', '优秀', '喜欢', '开心', 'good', 'great', 'excellent']);
        const negativeWords = new Set(['差', '糟', '坏', '讨厌', '失望', 'bad', 'poor', 'terrible']);
        
        let score = 0;
        const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
        
        words.forEach(word => {
            if (positiveWords.has(word)) score++;
            if (negativeWords.has(word)) score--;
        });
        
        let sentiment = '中性';
        if (score > 0) sentiment = '积极';
        if (score < 0) sentiment = '消极';
        
        sentimentScore.textContent = sentiment;
    }

    // 主观性分析
    function analyzeSubjectivity(text) {
        const subjectiveWords = new Set(['认为', '觉得', '感觉', '我', '喜欢', '讨厌', 'think', 'feel', 'believe']);
        const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
        
        let subjectiveCount = 0;
        words.forEach(word => {
            if (subjectiveWords.has(word)) subjectiveCount++;
        });
        
        const score = words.length ? (subjectiveCount / words.length * 100) : 0;
        subjectivityScore.textContent = score.toFixed(1) + '%';
    }

    // 可读性分析
    function analyzeReadability(text) {
        const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim());
        const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
        const complexWords = words.filter(w => w.length > 4).length;
        
        // 简化的Flesch-Kincaid阅读指数
        const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (complexWords / words.length);
        readabilityScore.textContent = Math.max(0, Math.min(100, Math.round(score)));
    }

    // 词性分析
    function analyzePOS(text) {
        // 简单的词性标注（实际应使用NLP库）
        const nouns = text.match(/[\u4e00-\u9fa5]*[人物家店国市区岛山河湖海]|[a-zA-Z]+(?:er|or|ist|man)s?\b/g) || [];
        const verbs = text.match(/[\u4e00-\u9fa5]*[来去跑走看说做想]|[a-zA-Z]+(?:ing|ed|s)\b/g) || [];
        const adjs = text.match(/[\u4e00-\u9fa5]*[大小好坏高低美丑]|[a-zA-Z]+(?:ful|ous|ive|able|y)\b/g) || [];
        
        // 创建词性分布图表
        const total = nouns.length + verbs.length + adjs.length;
        if (total === 0) return;
        
        const distribution = {
            '名词': (nouns.length / total * 100).toFixed(1) + '%',
            '动词': (verbs.length / total * 100).toFixed(1) + '%',
            '形容词': (adjs.length / total * 100).toFixed(1) + '%'
        };
        
        posDistribution.innerHTML = Object.entries(distribution)
            .map(([pos, percent]) => `
                <div class="pos-item">
                    <span class="pos-label">${pos}</span>
                    <div class="pos-bar">
                        <div class="pos-fill" style="width: ${percent}"></div>
                        <span class="pos-value">${percent}</span>
                    </div>
                </div>
            `).join('');
    }

    // 风格分析
    function analyzeStyle(text) {
        const styles = [];
        
        // 判断写作风格
        if (text.length / text.split(/[.!?。！？]+/).length > 30) {
            styles.push('长句');
        }
        if ((text.match(/[!！?？]/g) || []).length > text.length / 100) {
            styles.push('感情丰富');
        }
        if ((text.match(/[\u4e00-\u9fa5]{4,}/g) || []).length > text.length / 50) {
            styles.push('书面语');
        }
        if ((text.match(/[，。；：、]/g) || []).length > text.length / 20) {
            styles.push('结构复杂');
        }
        
        styleAnalysis.innerHTML = styles
            .map(style => `<span class="style-tag">${style}</span>`)
            .join('');
    }

    // 关键词提取
    function extractKeywords(text) {
        const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
        const stopWords = new Set(['的', '了', '和', '是', '就', '都', '而', '及', 'the', 'and', 'is', 'are']);
        
        // 统计词频
        const frequency = {};
        words.forEach(word => {
            if (!stopWords.has(word.toLowerCase())) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        
        // 提取关键词
        const keywordList = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => `
                <div class="keyword-item">
                    <span class="keyword-text">${word}</span>
                    <span class="keyword-count">${count}</span>
                </div>
            `)
            .join('');
            
        keywords.innerHTML = keywordList;
    }

    // 重置分析结果
    function resetAnalysis() {
        sentimentScore.textContent = '中性';
        subjectivityScore.textContent = '0%';
        readabilityScore.textContent = '0';
        posDistribution.innerHTML = '';
        styleAnalysis.innerHTML = '';
        keywords.innerHTML = '';
    }
}); 