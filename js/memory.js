class MemorySystem {
    constructor() {
        // 艾宾浩斯记忆间隔（单位：小时）
        this.intervals = [0, 24, 72, 168, 360, 720];
        this.currentMode = sessionStorage.getItem('studyMode') || 'zh2latin';
        this.words = [];
        this.todayTarget = 0; // 今日目标单词数
        
        console.log('MemorySystem 初始化完成，当前模式:', this.currentMode);
        
        // 尝试从本地存储加载数据
        this.loadFromLocalStorage();
    }

    // 从本地存储加载数据
    loadFromLocalStorage() {
        try {
            const stats = JSON.parse(localStorage.getItem(this.currentMode));
            if (stats && stats.progress) {
                this.words = stats.progress;
                console.log('从本地存储加载了进度数据，单词数量:', this.words.length);
            }
        } catch (error) {
            console.error('从本地存储加载数据失败:', error);
        }
    }

    // 初始化词库
    initializeWords(words) {
        console.log('初始化词库，单词数量:', words.length);
        try {
            // 从 localStorage 获取已有进度
            const stats = JSON.parse(localStorage.getItem(this.currentMode)) || {
                wordCount: 0,
                accuracy: 0,
                lastStudyTime: null,
                progress: []
            };

            // 如果已有进度，合并进度信息
            if (stats.progress && stats.progress.length > 0) {
                console.log('合并已有进度信息');
                this.words = words.map(word => {
                    const existingProgress = stats.progress.find(p => 
                        p.chinese === word.chinese && p.latin === word.latin
                    );
                    return existingProgress || {
                        ...word,
                        stage: 0,
                        nextReview: new Date().getTime(),
                        correctCount: 0,
                        totalCount: 0,
                        lastReviewed: null  // 新单词的lastReviewed为null
                    };
                });
            } else {
                console.log('创建新的进度信息');
                // 新建进度信息
                this.words = words.map(word => ({
                    ...word,
                    stage: 0,
                    nextReview: new Date().getTime(),
                    correctCount: 0,
                    totalCount: 0,
                    lastReviewed: null  // 新单词的lastReviewed为null
                }));
            }

            // 更新 localStorage
            stats.progress = this.words;
            localStorage.setItem(this.currentMode, JSON.stringify(stats));
            console.log('词库初始化完成，已保存到本地存储');
            
            this.updateTodayTarget(); // 更新今日目标
            return true;
        } catch (error) {
            console.error('初始化词库时出错:', error);
            return false;
        }
    }

    // 获取下一个需要复习的单词
    getNextWord() {
        console.log('获取下一个单词...');
        try {
            // 如果词库为空，返回null
            if (!this.words || this.words.length === 0) {
                console.log('词库为空');
                return null;
            }

            // 优先返回未复习过的单词
            const unreviewedWords = this.words.filter(word => !word.lastReviewed);
            if (unreviewedWords.length > 0) {
                const index = Math.floor(Math.random() * unreviewedWords.length);
                const selectedWord = unreviewedWords[index];
                console.log('选择了未复习的单词:', selectedWord);
                return selectedWord;
            }

            // 如果所有单词都复习过了，检查是否有需要复习的单词
            const now = new Date().getTime();
            const reviewableWords = this.words.filter(word => word.nextReview <= now);
            
            if (reviewableWords.length === 0) {
                console.log('没有需要复习的单词');
                return null;
            }
            
            // 优先复习正确率较低的单词
            reviewableWords.sort((a, b) => {
                const aRate = a.correctCount / (a.totalCount || 1);
                const bRate = b.correctCount / (b.totalCount || 1);
                return aRate - bRate;
            });
            
            // 在前3个单词中随机选择一个
            const index = Math.floor(Math.random() * Math.min(3, reviewableWords.length));
            const selectedWord = reviewableWords[index];
            console.log('选择了需要复习的单词:', selectedWord);
            return selectedWord;
        } catch (error) {
            console.error('获取下一个单词时出错:', error);
            return null;
        }
    }

    // 更新单词学习状态
    updateWordStatus(word, isCorrect) {
        console.log('更新单词状态:', word, '正确:', isCorrect);
        try {
            const wordIndex = this.words.findIndex(w => 
                w.chinese === word.chinese && w.latin === word.latin
            );

            if (wordIndex === -1) {
                console.error('未找到要更新的单词');
                return false;
            }

            const updatedWord = this.words[wordIndex];
            updatedWord.lastReviewed = new Date().getTime();
            updatedWord.totalCount++;
            
            if (isCorrect) {
                updatedWord.correctCount++;
                updatedWord.stage = Math.min(
                    updatedWord.stage + 1,
                    this.intervals.length - 1
                );
            } else {
                updatedWord.stage = Math.max(0, updatedWord.stage - 1);
            }

            // 计算下次复习时间
            const interval = this.intervals[updatedWord.stage];
            updatedWord.nextReview = new Date().getTime() + interval * 60 * 60 * 1000;

            // 更新 localStorage
            const stats = JSON.parse(localStorage.getItem(this.currentMode)) || {
                wordCount: 0,
                accuracy: 0,
                lastStudyTime: null,
                progress: []
            };
            
            // 更新总体统计数据
            const todayStats = this.getTodayStats();
            stats.wordCount = todayStats.count;
            stats.accuracy = todayStats.accuracy;
            stats.lastStudyTime = new Date().getTime();
            stats.progress = this.words;
            
            localStorage.setItem(this.currentMode, JSON.stringify(stats));
            
            console.log('单词状态更新完成，今日完成:', stats.wordCount, '正确率:', stats.accuracy + '%');
            return true;
        } catch (error) {
            console.error('更新单词状态时出错:', error);
            return false;
        }
    }

    // 计算下次复习时间
    calculateNextReview(stage) {
        const now = new Date().getTime();
        const hours = this.intervals[stage];
        return now + hours * 60 * 60 * 1000;
    }

    // 获取今日学习统计
    getTodayStats() {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            
            // 获取今天复习过的单词
            const todayWords = this.words.filter(w => 
                w.lastReviewed >= todayStart.getTime() && 
                w.lastReviewed <= todayEnd.getTime()
            );
            
            // 计算正确率
            let totalCorrect = 0;
            todayWords.forEach(word => {
                if (word.correctCount > 0) {
                    totalCorrect++;
                }
            });
            
            const accuracy = todayWords.length > 0 
                ? Math.round((totalCorrect / todayWords.length) * 100) 
                : 0;
            
            console.log('统计数据:', {
                todayWords: todayWords.length,
                totalCorrect,
                accuracy
            });
            
            return {
                count: todayWords.length,
                accuracy: accuracy
            };
        } catch (error) {
            console.error('获取今日统计时出错:', error);
            return { count: 0, accuracy: 0 };
        }
    }

    // 获取今天需要复习的单词总数
    getTodayTotalWords() {
        return this.todayTarget;
    }

    // 更新今日目标
    updateTodayTarget() {
        console.log('更新今日目标...');
        try {
            const now = new Date().getTime();
            this.todayTarget = this.words.filter(word => word.nextReview <= now + 24 * 60 * 60 * 1000).length;
            console.log('今日目标更新为:', this.todayTarget);
            return true;
        } catch (error) {
            console.error('更新今日目标时出错:', error);
            return false;
        }
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

    // 获取学习统计信息
    getStats() {
        const stats = JSON.parse(localStorage.getItem(this.currentMode));
        return {
            wordCount: stats.wordCount || 0,
            accuracy: stats.accuracy || 0,
            progress: Math.round((stats.wordCount || 0) * 100 / (this.words.length || 1))
        };
    }
}
