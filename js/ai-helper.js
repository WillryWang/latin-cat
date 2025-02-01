class AIHelper {
    constructor() {
        this.API_KEY = 'b01e68dc5d3f49428c0c4facb90b173e.XBNVcIHAMi8s4gFK';
        this.API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        this.CACHE_KEY = 'aiTipsCache';
        this.cache = this.loadCache();
    }

    // 加载缓存
    loadCache() {
        const cached = localStorage.getItem(this.CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    }

    // 保存缓存
    saveCache() {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    }

    // 获取缓存的提示
    getCachedTip(word) {
        const cacheKey = word.latin;
        return this.cache[cacheKey];
    }

    // 保存提示到缓存
    saveTipToCache(word, tip) {
        const cacheKey = word.latin;
        this.cache[cacheKey] = {
            latin: word.latin,
            chinese: word.chinese,
            tip: tip
        };
        this.saveCache();
    }

    // 清除缓存
    clearCache() {
        this.cache = {};
        localStorage.removeItem(this.CACHE_KEY);
        console.log('AI提示缓存已清除');
    }

    async generateMemoryTip(word, userAnswer) {
        // 先检查缓存
        const cachedTip = this.getCachedTip(word);
        if (cachedTip) {
            console.log('使用缓存的AI提示');
            return cachedTip.tip;
        }

        console.log('没有缓存，调用AI接口获取提示');
        const prompt = `作为一个拉丁文词根专家，请分析这个拉丁文单词"${word.latin}"的词根构成，并生成一个易于记忆的提示。

要求：
1. 分析单词的词根、前缀或后缀的含义
2. 解释这些词根与植物特征的关联
3. 提供一个简单的记忆方法

格式：
词根分析：[分析词根的来源和含义]
特征关联：[解释词根与植物特征的关系]
记忆方法：[提供一个简单的记忆技巧]

注意：回答要简洁，每部分不超过2句话。
中文释义：${word.chinese.join('，')}
用户错误答案：${userAnswer}`;

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: "glm-4-flash",
                    messages: [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 800,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const tip = data.choices[0].message.content;
            
            // 保存到缓存
            this.saveTipToCache(word, tip);
            
            return tip;
        } catch (error) {
            console.error('获取AI提示时出错:', error);
            return '抱歉，暂时无法生成记忆提示。';
        }
    }
}
