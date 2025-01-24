class CSVParser {
    constructor() {
        this.words = [];
    }

    // 解析CSV文件
    async parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    console.log('文件读取成功，开始解析内容');
                    const text = event.target.result;
                    if (!text.trim()) {
                        throw new Error('文件内容为空');
                    }
                    this.words = this.parseCSVContent(text);
                    console.log('解析成功，获取到单词数:', this.words.length);
                    resolve(this.words);
                } catch (error) {
                    console.error('解析CSV内容时出错:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('读取文件时出错:', error);
                reject(new Error('文件读取失败，请检查文件是否损坏'));
            };

            try {
                console.log('开始读取文件');
                reader.readAsText(file);
            } catch (error) {
                console.error('启动文件读取时出错:', error);
                reject(error);
            }
        });
    }

    // 解析CSV内容
    parseCSVContent(content) {
        console.log('开始解析CSV内容');
        const lines = content.split(/\r\n|\n/);
        console.log('总行数:', lines.length);
        const words = [];

        // 检测第一行是否为表头
        let startIndex = 0;
        if (lines.length > 0) {
            const firstLine = lines[0].toLowerCase();
            // 如果第一行包含这些关键词，认为是表头
            if (firstLine.includes('chinese') || 
                firstLine.includes('latin') || 
                firstLine.includes('中文') || 
                firstLine.includes('拉丁') || 
                firstLine.includes('name') || 
                firstLine.includes('名称')) {
                startIndex = 1;
                console.log('检测到表头，从第二行开始解析');
            }
        }

        // 从非表头行开始解析
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                console.log(`跳过空行: 第 ${i + 1} 行`);
                continue;
            }
            
            const parts = line.split(',').map(item => item.trim());
            const chinese = parts[0];
            const latin = parts[1];
            
            if (chinese && latin) {
                words.push({
                    chinese: chinese,
                    latin: latin,
                    lastReviewed: null,
                    reviewCount: 0,
                    correctCount: 0
                });
            } else {
                console.warn(`行 ${i + 1} 格式不正确: ${line}`);
            }
        }

        console.log('解析完成，有效单词数:', words.length);
        if (words.length === 0) {
            throw new Error('没有找到有效的单词数据，请检查CSV文件格式是否正确');
        }

        return words;
    }

    // 获取所有单词
    getWords() {
        return this.words;
    }

    // 获取单词数量
    getWordCount() {
        return this.words.length;
    }
}
