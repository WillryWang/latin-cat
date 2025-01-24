class MemorySystem {
    constructor() {
        // 艾宾浩斯记忆间隔（单位：小时）
        this.intervals = [0, 24, 72, 168, 360, 720];
        this.words = [];
        this.todayTarget = 0; // 今日目标单词数
    }

    // 初始化词库
    initializeWords(words) {
        this.words = words.map(word => ({
            ...word,
            stage: 0,  // 当前记忆阶段
            nextReview: new Date().getTime()  // 下次复习时间
        }));
        this.updateTodayTarget(); // 更新今日目标
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

    // 获取今天需要复习的单词总数
    getTodayTotalWords() {
        return this.todayTarget;
    }

    // 更新今日目标单词数
    updateTodayTarget() {
        const now = new Date().getTime();
        this.todayTarget = this.words.filter(word => word.nextReview <= now).length;
    }

    // 保存到本地存储
    saveToLocalStorage() {
        const data = {
            words: this.words,
            todayTarget: this.todayTarget
        };
        localStorage.setItem('wordData', JSON.stringify(data));
    }

    // 从本地存储加载
    loadFromLocalStorage() {
        const data = localStorage.getItem('wordData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    // 兼容旧版本的数据格式
                    this.words = parsed;
                    this.updateTodayTarget();
                } else {
                    // 新版本的数据格式
                    this.words = parsed.words || [];
                    this.todayTarget = parsed.todayTarget || 0;
                }
                return true;
            } catch (e) {
                console.error('加载数据失败:', e);
                return false;
            }
        }
        return false;
    }

    // 重置今日学习进度
    resetTodayProgress() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.words.forEach(word => {
            delete word.lastReviewed;
            delete word.correctCount;
            delete word.reviewCount;
        });

        this.updateTodayTarget(); // 重置时更新今日目标
        this.saveToLocalStorage();
    }
}
