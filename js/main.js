// 初始化全局变量
let totalWords = 0;
let currentMode = sessionStorage.getItem('studyMode') || 'zh2latin'; // 初始化当前模式
const csvParser = new CSVParser();
const memorySystem = new MemorySystem();
const aiHelper = new AIHelper();
let currentWord = null;
let currentProgress = 0;

// DOM 元素
let elements = {
    importSection: document.getElementById('importSection'),
    quizSection: document.getElementById('quizSection'),
    fileInput: document.getElementById('csvFile'),
    question: document.getElementById('question'),
    answer: document.getElementById('answer'),
    submit: document.getElementById('submit'),
    next: document.getElementById('next'),
    result: document.getElementById('result'),
    aiMemoryTip: document.getElementById('aiMemoryTip'),
    todayCount: document.getElementById('todayCount'),
    accuracy: document.getElementById('accuracy'),
    progressBar: document.getElementById('progressBar')
};

// 检查所有必要的 DOM 元素是否存在
function checkElements() {
    console.log('检查 DOM 元素...');
    const requiredElements = [
        'importSection', 'quizSection', 'fileInput', 'question',
        'answer', 'submit', 'result', 'next', 'todayCount',
        'accuracy', 'progressBar', 'aiMemoryTip'
    ];
    
    const missingElements = requiredElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
        console.error('缺少必要的 DOM 元素:', missingElements);
        return false;
    }
    
    console.log('所有必要的 DOM 元素都存在');
    return true;
}

// 处理启动页面
function handleSplashScreen() {
    // 移除启动页面相关代码
}

// 初始化应用
async function initializeApp() {
    console.log('开始初始化应用...');
    
    // 检查必要的元素是否存在
    const requiredElements = ['importSection', 'quizSection', 'fileInput', 'question', 'answer', 'submit', 'next', 'result', 'aiMemoryTip'];
    const missingElements = requiredElements.filter(id => !elements[id]);
    
    if (missingElements.length > 0) {
        console.error('初始化失败：缺少必要的 DOM 元素:', missingElements);
        return;
    }

    console.log('DOM 元素检查完成，开始初始化功能...');

    // 初始化设置功能
    initializeSettings();

    // 绑定文件上传事件
    elements.fileInput.addEventListener('change', handleFileUpload);

    // 绑定答题相关事件
    elements.submit.onclick = checkAnswer;
    elements.next.onclick = showNextWord;
    elements.answer.onkeypress = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (elements.submit.style.display !== 'none') {
                checkAnswer();
            } else if (elements.next.style.display !== 'none') {
                showNextWord();
            }
        }
    };

    // 监听输入框内容变化，控制提交按钮状态
    elements.answer.oninput = function() {
        elements.submit.disabled = !this.value.trim();
    };
    // 初始状态下禁用提交按钮
    elements.submit.disabled = true;

    // 尝试从本地存储加载数据
    try {
        console.log('尝试从本地存储加载词库数据...');
        const savedWords = localStorage.getItem('words');
        const currentMode = sessionStorage.getItem('studyMode') || 'zh2latin';
        
        // 检查是否有词库数据
        if (savedWords) {
            console.log('发现已有词库数据，直接进入答题模式');
            
            // 加载词库数据
            csvParser.words = JSON.parse(savedWords);
            
            // 从localStorage加载进度
            const stats = JSON.parse(localStorage.getItem(currentMode)) || {
                wordCount: 0,
                accuracy: 0,
                lastStudyTime: null,
                progress: []
            };
            
            // 初始化记忆系统
            if (stats.progress && stats.progress.length > 0) {
                memorySystem.words = stats.progress;
            } else {
                memorySystem.initializeWords(csvParser.words);
            }
            
            totalWords = csvParser.words.length;
            
            // 更新统计数据显示
            const todayStats = memorySystem.getTodayStats();
            console.log('初始化时获取到的统计数据:', todayStats);
            elements.todayCount.textContent = todayStats.count;
            elements.accuracy.textContent = todayStats.accuracy;
            
            // 更新今日目标
            memorySystem.updateTodayTarget();
            
            // 更新进度显示
            updateProgress('页面初始化');
            
            // 显示答题区域
            elements.importSection.style.display = 'none';
            elements.quizSection.style.display = 'block';
            
            // 加载第一个问题
            await showNextWord();
        } else {
            console.log('未找到词库数据，显示上传界面');
            // 显示上传界面
            elements.importSection.style.display = 'block';
            elements.quizSection.style.display = 'none';
        }
    } catch (error) {
        console.error('加载本地存储数据失败:', error);
        // 出错时显示上传界面
        elements.importSection.style.display = 'block';
        elements.quizSection.style.display = 'none';
    }

    console.log('应用初始化完成');
}

// 设置菜单相关
function initializeSettings() {
    console.log('初始化设置功能...');
    
    // 获取所有需要的 DOM 元素
    const settingsElements = {
        settingsBtn: document.getElementById('settingsBtn'),
        settingsMenu: document.getElementById('settingsMenu'),
        importNewBtn: document.getElementById('importNewBtn'),
        resetDataBtn: document.getElementById('resetDataBtn'),
        endLearningBtn: document.getElementById('endLearningBtn'),
        confirmDialog: document.getElementById('confirmDialog'),
        endLearningDialog: document.getElementById('endLearningDialog'),
        overlay: document.getElementById('overlay'),
        cancelReset: document.getElementById('cancelReset'),
        confirmReset: document.getElementById('confirmReset'),
        cancelEndLearning: document.getElementById('cancelEndLearning'),
        confirmEndLearning: document.getElementById('confirmEndLearning')
    };

    // 检查必要的元素是否存在
    const requiredElements = ['settingsBtn', 'settingsMenu'];
    const missingElements = requiredElements.filter(id => !settingsElements[id]);
    
    if (missingElements.length > 0) {
        console.error('设置功能初始化失败：缺少必要的 DOM 元素:', missingElements);
        return;
    }

    console.log('设置功能所需的 DOM 元素检查完成');

    // 切换设置菜单
    settingsElements.settingsBtn.onclick = function(e) {
        e.stopPropagation();
        console.log('切换设置菜单');
        settingsElements.settingsMenu.classList.toggle('show');
    };

    // 点击其他地方关闭菜单
    document.onclick = function(e) {
        if (!settingsElements.settingsMenu.contains(e.target) && 
            e.target !== settingsElements.settingsBtn) {
            console.log('关闭设置菜单');
            settingsElements.settingsMenu.classList.remove('show');
        }
    };

    // 导入新词库
    if (settingsElements.importNewBtn) {
        settingsElements.importNewBtn.onclick = function() {
            console.log('点击导入新词库');
            // 清空文件输入和已有数据
            elements.fileInput.value = '';
            csvParser.words = [];
            memorySystem.words = [];
            totalWords = 0;
            currentWord = null;
            
            // 重置统计数据显示
            elements.todayCount.textContent = '0';
            elements.accuracy.textContent = '0';
            
            // 切换界面
            settingsElements.settingsMenu.classList.remove('show');
            elements.importSection.style.display = 'block';
            elements.quizSection.style.display = 'none';
            
            // 清空答题界面
            elements.question.textContent = '';
            elements.answer.value = '';
            elements.result.style.display = 'none';
            elements.submit.style.display = 'flex';
            elements.next.style.display = 'none';
        };
    }

    // 重置数据
    if (settingsElements.resetDataBtn && settingsElements.confirmDialog && settingsElements.overlay) {
        settingsElements.resetDataBtn.onclick = function() {
            console.log('显示重置确认对话框');
            settingsElements.settingsMenu.classList.remove('show');
            settingsElements.confirmDialog.classList.add('show');
            settingsElements.overlay.classList.add('show');
        };

        // 取消重置
        if (settingsElements.cancelReset) {
            settingsElements.cancelReset.onclick = function() {
                console.log('取消重置');
                settingsElements.confirmDialog.classList.remove('show');
                settingsElements.overlay.classList.remove('show');
            };
        }

        // 确认重置
        if (settingsElements.confirmReset) {
            settingsElements.confirmReset.onclick = async function() {
                console.log('确认重置数据');
                try {
                    // 显示加载动画
                    this.innerHTML = '<span class="loading-spinner"></span>重置中...';
                    this.disabled = true;

                    // 清除本地存储
                    localStorage.clear();
                    
                    // 清除AI提示缓存
                    aiHelper.clearCache();
                    
                    // 重置所有状态
                    csvParser.words = [];
                    memorySystem.words = [];
                    totalWords = 0;
                    currentWord = null;
                    currentProgress = 0;
                    
                    // 重置界面
                    elements.todayCount.textContent = '0';
                    elements.accuracy.textContent = '0';
                    elements.progressBar.style.width = '0%';
                    
                    // 显示导入区域
                    elements.importSection.style.display = 'block';
                    elements.quizSection.style.display = 'none';
                    
                    // 关闭对话框
                    settingsElements.confirmDialog.classList.remove('show');
                    settingsElements.overlay.classList.remove('show');
                    
                    console.log('数据重置完成');
                    alert('数据已重置完成！');
                    
                } catch (error) {
                    console.error('重置数据时出错:', error);
                    alert('重置数据时出错，请刷新页面重试');
                } finally {
                    // 恢复按钮状态
                    this.innerHTML = '确定';
                    this.disabled = false;
                }
            };
        }
    }

    // 结束学习
    if (settingsElements.endLearningBtn && settingsElements.endLearningDialog) {
        settingsElements.endLearningBtn.onclick = function() {
            console.log('显示结束学习确认对话框');
            settingsElements.settingsMenu.classList.remove('show');
            settingsElements.endLearningDialog.classList.add('show');
            settingsElements.overlay.classList.add('show');
        };

        // 取消结束学习
        if (settingsElements.cancelEndLearning) {
            settingsElements.cancelEndLearning.onclick = function() {
                console.log('取消结束学习');
                settingsElements.endLearningDialog.classList.remove('show');
                settingsElements.overlay.classList.remove('show');
            };
        }

        // 确认结束学习
        if (settingsElements.confirmEndLearning) {
            settingsElements.confirmEndLearning.onclick = function() {
                console.log('确认结束学习');
                settingsElements.endLearningDialog.classList.remove('show');
                settingsElements.overlay.classList.remove('show');
                showCompletionMessage();
            };
        }
    }

    console.log('设置功能初始化完成');
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

        // 初始化记忆系统
        memorySystem.initializeWords(words);
        
        // 更新今日目标
        memorySystem.updateTodayTarget();
        
        // 更新进度显示
        updateProgress('文件上传');
        
        // 保存词库到本地存储
        localStorage.setItem('words', JSON.stringify(words));
        console.log('词库数据已保存到本地存储');

        // 切换到答题界面
        elements.importSection.style.display = 'none';
        elements.quizSection.style.display = 'block';
        await showNextWord();
        
        console.log('文件上传和初始化完成');
    } catch (error) {
        console.error('文件处理错误:', error);
        alert('文件解析失败：' + error.message + '\n请确保文件格式正确（中文名称,拉丁文名称）');
    }
}

// 显示下一个问题
async function showNextWord() {
    console.log('准备显示下一个问题...');
    
    try {
        // 重置界面状态
        elements.answer.value = '';
        elements.answer.disabled = false;
        elements.result.textContent = '';
        elements.aiMemoryTip.style.display = 'none';  // 隐藏AI记忆提示
        elements.aiMemoryTip.textContent = '';        // 清空AI记忆提示内容
        elements.submit.style.display = 'flex';
        elements.next.style.display = 'none';
        elements.submit.disabled = true;
        
        // 获取下一个单词
        currentWord = await memorySystem.getNextWord();
        console.log('获取到的下一个单词:', currentWord);
        
        if (!currentWord) {
            console.log('没有更多单词了');
            showCompletionMessage();
            return;
        }

        // 根据模式显示问题
        currentMode = currentMode || sessionStorage.getItem('studyMode') || 'zh2latin';
        if (currentMode === 'zh2latin') {
            // 如果有多个中文名称，随机选择一个显示
            const randomIndex = Math.floor(Math.random() * currentWord.chinese.length);
            elements.question.textContent = currentWord.chinese[randomIndex];
        } else {
            elements.question.textContent = currentWord.latin;
        }
        
        console.log('问题已显示');
        
    } catch (error) {
        console.error('显示下一个单词时出错:', error);
        alert('系统出现错误，请刷新页面重试');
    }
}

// 检查答案
async function checkAnswer() {
    console.log('开始检查答案...当前模式:', currentMode);
    
    try {
        // 检查必要的 DOM 元素
        if (!elements.answer || !elements.result || !elements.submit || !elements.next) {
            console.error('缺少必要的 DOM 元素');
            alert('页面出现错误，请刷新重试');
            return;
        }

        // 隐藏之前的AI提示（如果有）
        elements.aiMemoryTip.style.display = 'none';

        // 检查是否有当前单词
        if (!currentWord) {
            console.error('没有当前单词！');
            alert('没有当前问题，请先导入词库或刷新页面');
            return;
        }

        // 获取用户答案
        const userAnswer = elements.answer.value.trim().toLowerCase();
        console.log('用户输入答案:', userAnswer);
        
        if (!userAnswer) {
            console.log('答案为空，提示用户');
            alert('请输入答案后再提交！');
            return;
        }

        // 获取正确答案并检查（确保currentMode已初始化）
        currentMode = currentMode || sessionStorage.getItem('studyMode') || 'zh2latin';
        let isCorrect;
        if (currentMode === 'zh2latin') {
            const correctAnswer = currentWord.latin.toLowerCase();
            isCorrect = userAnswer === correctAnswer;
        } else {
            // 中文答案可以是任何一个有效的中文名称
            isCorrect = currentWord.chinese.some(name => name.toLowerCase() === userAnswer);
        }
        console.log('答案是否正确:', isCorrect);

        // 显示正确答案
        if (!isCorrect) {
            const correctAnswer = currentMode === 'zh2latin' 
                ? currentWord.latin
                : currentWord.chinese.join(' 或 ');
            elements.result.textContent = `正确答案是: ${correctAnswer}`;
            
            // 如果是拉丁文到中文模式，获取AI记忆提示
            if (currentMode === 'zh2latin') {
                elements.aiMemoryTip.textContent = '正在生成记忆提示...';
                elements.aiMemoryTip.style.display = 'block';
                
                try {
                    const tip = await aiHelper.generateMemoryTip(currentWord, userAnswer);
                    elements.aiMemoryTip.innerHTML = tip.replace(/\n/g, '<br>');
                } catch (error) {
                    console.error('获取AI提示时出错:', error);
                    elements.aiMemoryTip.style.display = 'none';
                }
            }
        } else {
            elements.result.textContent = '回答正确！';
        }

        // 更新记忆系统
        memorySystem.updateWordStatus(currentWord, isCorrect);
        
        // 更新今日目标
        memorySystem.updateTodayTarget();
        
        // 更新进度显示
        updateProgress('答题完成');
        
        // 更新统计数据显示
        const stats = memorySystem.getTodayStats();
        console.log('获取到的统计数据:', stats);
        elements.todayCount.textContent = stats.count;
        elements.accuracy.textContent = stats.accuracy;
        
        // 更新按钮状态
        elements.submit.style.display = 'none';
        elements.next.style.display = 'flex';
        
        // 禁用输入框
        elements.answer.disabled = true;

        console.log('答案检查完成，界面已更新');

    } catch (error) {
        console.error('检查答案时发生错误:', error);
        alert('系统出现错误，请刷新页面重试');
    }
}

// 更新进度显示
function updateProgress(source = '') {
    // 获取最新统计数据
    const stats = memorySystem.getTodayStats();
    elements.todayCount.textContent = stats.count;
    elements.accuracy.textContent = stats.accuracy;
    
    // 更新进度条
    const totalWords = memorySystem.getTodayTotalWords();
    console.log(`${source} - 今日目标单词数:`, totalWords);
    const progress = totalWords > 0 ? Math.round((stats.count / totalWords) * 100) : 0;
    console.log(`${source} - 当前进度:`, progress + '%');
    elements.progressBar.style.width = progress + '%';
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
    console.log('重新开始学习...');
    
    try {
        // 清除本地存储
        localStorage.clear();
        
        // 清除AI提示缓存
        aiHelper.clearCache();
        
        // 重置内存中的数据
        csvParser.words = [];
        memorySystem.words = [];
        currentWord = null;
        
        // 重置界面
        elements.importSection.style.display = 'block';
        elements.quizSection.style.display = 'none';
        elements.answer.value = '';
        elements.result.textContent = '';
        elements.aiMemoryTip.style.display = 'none';
        elements.aiMemoryTip.textContent = '';
        elements.todayCount.textContent = '0';
        elements.accuracy.textContent = '0';
        elements.progressBar.style.width = '0%';
        
        console.log('数据已重置，可以重新开始学习');
        
    } catch (error) {
        console.error('重置数据时出错:', error);
        alert('重置数据时出错，请刷新页面重试');
    }
}

// 在DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM内容加载完成，开始初始化应用');
        initializeApp();
    });
} else {
    console.log('DOM已经加载完成，直接初始化应用');
    initializeApp();
}
