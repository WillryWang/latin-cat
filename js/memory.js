class MemorySystem {
    constructor() {
        // 艾宾浩斯记忆间隔（单位：小时）
        this.intervals = [0, 24, 72, 168, 360, 720];
        this.words = [];
    }

    // 初始化词库
    initializeWords(words) {
        this.words = words.map(word => ({
            ...word,
            stage: 0,  // 当前记忆阶段
            nextReview: new Date().getTime()  // 下次复习时间
        }));
        this.saveToLocalStorage();
    }

    // 获取下一个需要复习的单词
    getNextWord() {
        const now = new Date().getTime();
        const reviewableWords = this.words.filter(word => word.nextReview <= now);
        
        if (reviewableWords.length === 0) return null;
        
        // 优先复习较早阶段的单词
        reviewableWords.sort((a, b) => a.stage - b.stage);
        
        // 在前3个单词中随机选择一个，增加一些随机性
        const index = Math.floor(Math.random() * Math.min(3, reviewableWords.length));
        return reviewableWords[index];
    }

    // 更新单词学习状态
    updateWordStatus(word, isCorrect) {
        const wordIndex = this.words.findIndex(w => 
            w.chinese === word.chinese && w.latin === word.latin
        );

        if (wordIndex === -1) return;

        if (isCorrect) {
            // 答对，进入下一个记忆阶段
            this.words[wordIndex].stage = Math.min(
                this.words[wordIndex].stage + 1,
                this.intervals.length - 1
            );
            this.words[wordIndex].correctCount++;
        } else {
            // 答错，退回到第一个阶段
            this.words[wordIndex].stage = 0;
        }

        // 更新复习次数和下次复习时间
        this.words[wordIndex].reviewCount++;
        this.words[wordIndex].lastReviewed = new Date().getTime();
        this.words[wordIndex].nextReview = this.calculateNextReview(this.words[wordIndex].stage);
        
        this.saveToLocalStorage();
    }

    // 计算下次复习时间
    calculateNextReview(stage) {
        const now = new Date().getTime();
        const hours = this.intervals[stage];
        return now + hours * 60 * 60 * 1000;
    }

    // 获取今日学习统计
    getTodayStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayReviews = this.words.filter(word => 
            word.lastReviewed >= today.getTime()
        );

        const totalReviews = todayReviews.length;
        const correctReviews = todayReviews.reduce((sum, word) => 
            sum + (word.correctCount || 0), 0
        );

        return {
            count: totalReviews,
            accuracy: totalReviews ? Math.round((correctReviews / totalReviews) * 100) : 0
        };
    }

    // 保存到本地存储
    saveToLocalStorage() {
        localStorage.setItem('wordData', JSON.stringify(this.words));
    }

    // 从本地存储加载
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('wordData');
        if (savedData) {
            this.words = JSON.parse(savedData);
            return true;
        }
        return false;
    }

    // 重置今日学习进度
    resetTodayProgress() {
        const today = new Date().toDateString();
        const now = new Date().getTime();
        
        // 找出今天学习过的单词
        const todayWords = this.words.filter(word => 
            word.lastReviewed && new Date(word.lastReviewed).toDateString() === today
        );
        
        // 如果今天有学习记录，只重置今天的单词
        // 如果今天没有学习记录，重置所有单词
        const wordsToReset = todayWords.length > 0 ? todayWords : this.words;
        
        // 重置选定的单词
        wordsToReset.forEach(word => {
            const index = this.words.findIndex(w => 
                w.chinese === word.chinese && w.latin === word.latin
            );
            if (index !== -1) {
                this.words[index].lastReviewed = null;  // 清除上次复习时间
                this.words[index].nextReview = now;     // 设置为当前时间，使其立即可复习
                this.words[index].stage = 0;            // 重置到初始阶段
                this.words[index].correctCount = 0;     // 重置正确计数
                this.words[index].reviewCount = 0;      // 重置复习计数
            }
        });
        
        // 保存到本地存储
        this.saveToLocalStorage();
        console.log(`学习进度已重置，${wordsToReset.length}个单词已设置为可复习状态`);
    }
}
