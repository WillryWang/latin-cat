// 初始化全局变量
let totalWords = 0;
let currentMode = 'cn2latin'; // 默认模式：中文到拉丁文
const csvParser = new CSVParser();
const memorySystem = new MemorySystem();
let currentWord = null;
let currentProgress = 0;

// DOM 元素
const elements = {
    fileInput: document.getElementById('csvFile'),
    importSection: document.getElementById('importSection'),
    quizSection: document.querySelector('.quiz-section'),
    question: document.getElementById('question'),
    answer: document.getElementById('answer'),
    submit: document.getElementById('submit'),
    result: document.getElementById('result'),
    next: document.getElementById('next'),
    todayCount: document.getElementById('todayCount'),
    accuracy: document.getElementById('accuracy'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    progressFill: document.querySelector('.progress-fill')
};

// 处理启动页面
function handleSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    
    // 2秒后开始淡出动画
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        
        // 监听动画结束，然后移除启动页面
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.remove();
        });
    }, 2000);
}

// 设置菜单相关
function initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const importNewBtn = document.getElementById('importNewBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const endLearningBtn = document.getElementById('endLearningBtn');
    const confirmDialog = document.getElementById('confirmDialog');
    const endLearningDialog = document.getElementById('endLearningDialog');
    const overlay = document.getElementById('overlay');
    const cancelReset = document.getElementById('cancelReset');
    const confirmReset = document.getElementById('confirmReset');
    const cancelEndLearning = document.getElementById('cancelEndLearning');
    const confirmEndLearning = document.getElementById('confirmEndLearning');

    // 切换设置菜单
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
        settingsMenu.classList.remove('show');
    });

    // 导入新词库
    importNewBtn.addEventListener('click', () => {
        settingsMenu.classList.remove('show');
        elements.importSection.style.display = 'block';
        elements.quizSection.style.display = 'none';
        elements.fileInput.value = ''; // 清空文件输入
    });

    // 显示结束学习确认对话框
    endLearningBtn.addEventListener('click', () => {
        settingsMenu.classList.remove('show');
        endLearningDialog.classList.add('show');
        overlay.classList.add('show');
    });

    // 取消结束学习
    cancelEndLearning.addEventListener('click', () => {
        endLearningDialog.classList.remove('show');
        overlay.classList.remove('show');
    });

    // 确认结束学习
    confirmEndLearning.addEventListener('click', () => {
        endLearningDialog.classList.remove('show');
        overlay.classList.remove('show');
        // 显示完成信息
        showCompletionMessage();
    });

    // 显示重置确认对话框
    resetDataBtn.addEventListener('click', () => {
        settingsMenu.classList.remove('show');
        confirmDialog.classList.add('show');
        overlay.classList.add('show');
    });

    // 取消重置
    cancelReset.addEventListener('click', () => {
        confirmDialog.classList.remove('show');
        overlay.classList.remove('show');
    });

    // 确认重置
    confirmReset.addEventListener('click', async () => {
        // 显示加载动画
        confirmReset.innerHTML = '<span class="loading-spinner"></span>重置中...';
        confirmReset.disabled = true;

        try {
            // 清除本地存储
            localStorage.clear();
            
            // 重置所有状态
            csvParser.words = [];
            memorySystem.words = [];
            totalWords = 0;
            currentWord = null;
            currentProgress = 0;
            
            // 重置界面
            elements.todayCount.textContent = '0';
            elements.accuracy.textContent = '0';
            elements.progressFill.style.width = '0%';
            
            // 切换到导入界面
            elements.importSection.style.display = 'block';
            elements.quizSection.style.display = 'none';
            elements.fileInput.value = '';

            // 关闭对话框
            setTimeout(() => {
                confirmDialog.classList.remove('show');
                overlay.classList.remove('show');
                confirmReset.innerHTML = '确认重置';
                confirmReset.disabled = false;
            }, 1000);

        } catch (error) {
            console.error('重置失败:', error);
            alert('重置过程中出现错误，请刷新页面后重试');
        }
    });
}

// 初始化函数
function initializeApp() {
    console.log('初始化应用...');
    
    // 处理启动页面
    handleSplashScreen();
    
    // 尝试从本地存储加载数据
    if (memorySystem.loadFromLocalStorage()) {
        showQuizSection();
        updateStats();
        showNextQuestion();
    }

    // 初始化设置功能
    initializeSettings();

    // 绑定文件上传事件
    console.log('绑定文件上传事件...');
    elements.fileInput.addEventListener('change', handleFileUpload);
    
    // 绑定答题相关事件
    elements.submit.addEventListener('click', checkAnswer);
    elements.next.addEventListener('click', () => {
        elements.next.style.display = 'none';
        elements.answer.value = '';
        elements.result.textContent = '';
        elements.result.className = 'result';
        
        // 添加淡出动画
        elements.question.style.opacity = '0';
        setTimeout(() => {
            showNextQuestion();
            // 添加淡入动画
            elements.question.style.opacity = '1';
        }, 300);
    });
    elements.answer.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // 绑定模式切换事件
    elements.modeBtns.forEach(button => {
        button.addEventListener('click', () => {
            elements.modeBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMode = button.dataset.mode;
            if (currentWord) {
                showQuestion(currentWord);
            }
        });
    });

    console.log('应用初始化完成');
}

// 显示答题区域
function showQuizSection() {
    elements.importSection.style.display = 'none';
    elements.quizSection.style.display = 'block';
    // 添加淡入动画
    elements.quizSection.style.opacity = '0';
    setTimeout(() => {
        elements.quizSection.style.opacity = '1';
    }, 0);
}

// 处理文件上传
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error('没有选择文件');
        alert('请选择一个CSV文件');
        return;
    }

    // 检查文件类型
    if (file.type && !file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
        console.error('文件类型错误');
        alert('请选择CSV格式的文件');
        return;
    }

    try {
        console.log('开始解析文件:', file.name);
        const words = await csvParser.parseFile(file);
        console.log('解析完成，单词数量:', words.length);
        
        if (words.length === 0) {
            alert('CSV文件似乎是空的，或格式不正确。\n请确保文件包含中文名称和拉丁文名称，用逗号分隔。');
            return;
        }

        totalWords = words.length;
        memorySystem.initializeWords(words);
        showQuizSection();
        showNextQuestion();
    } catch (error) {
        console.error('文件处理错误:', error);
        alert('文件解析失败：' + error.message + '\n请确保文件格式正确（中文名称,拉丁文名称）');
    }
}

// 更新进度条
function updateProgress() {
    const stats = memorySystem.getTodayStats();
    const todayTotal = memorySystem.getTodayTotalWords();
    currentProgress = todayTotal > 0 ? Math.min((stats.count / todayTotal) * 100, 100) : 0;
    elements.progressFill.style.width = `${currentProgress}%`;
    elements.todayCount.textContent = `${stats.count}/${todayTotal}`;
}

// 显示下一个问题
function showNextQuestion() {
    currentWord = memorySystem.getNextWord();
    
    if (currentWord) {
        showQuestion(currentWord);
        // 启用输入框和提交按钮
        elements.answer.disabled = false;
        elements.submit.disabled = false;
        elements.answer.focus(); // 自动聚焦到输入框
    } else {
        showCompletionMessage();
    }
    updateProgress();
}

// 显示问题
function showQuestion(word) {
    if (currentMode === 'cn2latin') {
        elements.question.textContent = `请输入"${word.chinese}"的拉丁文名称：`;
    } else {
        elements.question.textContent = `请输入"${word.latin}"的中文名称：`;
    }
    elements.answer.style.display = 'block';
    elements.submit.style.display = 'inline-block';
}

// 检查答案
function checkAnswer() {
    if (!currentWord) return;

    const userAnswer = elements.answer.value.trim();
    if (!userAnswer) return;

    // 禁用输入框和提交按钮
    elements.answer.disabled = true;
    elements.submit.disabled = true;

    let isCorrect = false;

    // 统一处理空格和大小写
    const normalizeText = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();

    if (currentMode === 'cn2latin') {
        // 拉丁文答案校验：忽略大小写和空格
        const normalizedUserAnswer = normalizeText(userAnswer);
        const normalizedCorrectAnswer = normalizeText(currentWord.latin);
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    } else {
        // 中文答案校验：完全匹配
        isCorrect = userAnswer === currentWord.chinese;
    }

    // 显示结果
    elements.result.className = `result ${isCorrect ? 'correct' : 'incorrect'}`;
    if (isCorrect) {
        elements.result.textContent = '答对了！';
    } else {
        elements.result.textContent = `答错了。正确答案是：${currentMode === 'cn2latin' ? currentWord.latin : currentWord.chinese}`;
    }

    // 更新学习状态
    memorySystem.updateWordStatus(currentWord, isCorrect);
    updateStats();

    // 显示下一题按钮
    elements.next.style.display = 'inline-block';
}

// 更新统计信息
function updateStats() {
    const stats = memorySystem.getTodayStats();
    elements.todayCount.textContent = `${stats.count}/${memorySystem.getTodayTotalWords()}`;
    elements.accuracy.textContent = stats.accuracy;
}

// 显示完成信息
function showCompletionMessage() {
    const completionMessage = `
        <div class="completion-message">
            <i class="fas fa-trophy"></i>
            <h2>太棒了！今天的单词都已经复习完成了！</h2>
            <p>今日完成：${elements.todayCount.textContent} 个</p>
            <p>正确率：${elements.accuracy.textContent}%</p>
            <button id="restartButton" class="restart-btn">
                <i class="fas fa-redo"></i>
                重新开始
            </button>
        </div>
    `;
    elements.question.innerHTML = completionMessage;
    elements.answer.style.display = 'none';
    elements.submit.style.display = 'none';
    elements.next.style.display = 'none';

    // 绑定重新开始按钮事件
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', restartLearning);
    }
}

// 重新开始学习
function restartLearning() {
    // 重置当天的学习进度
    memorySystem.resetTodayProgress();
    
    // 重置界面
    elements.answer.value = '';
    elements.todayCount.textContent = '0';
    elements.accuracy.textContent = '0';
    elements.progressFill.style.width = '0%';
    elements.result.textContent = '';
    elements.result.className = 'result';
    elements.next.style.display = 'none';
    
    // 启用输入框和提交按钮
    elements.answer.disabled = false;
    elements.submit.disabled = false;
    elements.answer.style.display = 'block';
    elements.submit.style.display = 'block';
    
    // 淡出当前内容
    elements.question.style.opacity = '0';
    elements.answer.style.opacity = '0';
    
    // 300ms后显示新问题
    setTimeout(() => {
        showNextQuestion();
        elements.question.style.opacity = '1';
        elements.answer.style.opacity = '1';
        elements.answer.focus(); // 自动聚焦到输入框
    }, 300);
}

// 在DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
