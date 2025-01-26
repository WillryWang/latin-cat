// landing.js - 首页逻辑处理

document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 获取所有需要的元素
    const splashScreen = document.getElementById('splashScreen');
    const welcomeContainer = document.querySelector('.welcome-container');
    const modeSelection = document.querySelector('.mode-selection');
    
    // 确保元素都存在
    if (!splashScreen || !welcomeContainer || !modeSelection) {
        console.error('找不到必要的页面元素！');
        return;
    }

    console.log('所有元素已找到，准备显示...');
    
    // 加载学习进度
    loadProgress();

    // 处理 splash 屏幕和内容显示
    setTimeout(() => {
        console.log('开始隐藏 splash 屏幕...');
        // 淡出 splash 屏幕
        splashScreen.classList.add('hidden');
        
        // 显示欢迎内容
        setTimeout(() => {
            console.log('显示欢迎内容...');
            welcomeContainer.classList.add('visible');
            welcomeContainer.style.display = 'block'; // 确保元素可见
            
            // 稍后显示模式选择
            setTimeout(() => {
                console.log('显示模式选择按钮...');
                modeSelection.style.display = 'block'; // 确保元素可见
                modeSelection.classList.add('visible');
            }, 300);
        }, 500);
    }, 1500);

    // 绑定模式选择按钮事件
    document.getElementById('zh2latin')?.addEventListener('click', () => {
        console.log('中译拉模式被点击');
        selectMode('zh2latin');
    });

    document.getElementById('latin2zh')?.addEventListener('click', () => {
        console.log('拉译中模式被点击');
        selectMode('latin2zh');
    });
});

// 加载两种模式的学习进度
function loadProgress() {
    console.log('加载学习进度...');
    
    // 从 localStorage 获取数据
    const zh2latinStats = JSON.parse(localStorage.getItem('zh2latin')) || {
        wordCount: 0,
        accuracy: 0,
        lastStudyTime: null,
        progress: []
    };

    const latin2zhStats = JSON.parse(localStorage.getItem('latin2zh')) || {
        wordCount: 0,
        accuracy: 0,
        lastStudyTime: null,
        progress: []
    };

    // 计算进度百分比
    const zh2latinProgress = Math.min(
        Math.round((zh2latinStats.wordCount || 0) * 100 / Math.max(zh2latinStats.progress?.length || 1, 1)),
        100
    );
    
    const latin2zhProgress = Math.min(
        Math.round((latin2zhStats.wordCount || 0) * 100 / Math.max(latin2zhStats.progress?.length || 1, 1)),
        100
    );

    console.log('进度计算完成:', { zh2latinProgress, latin2zhProgress });

    // 更新进度条和文本
    const zh2latinProgressBar = document.getElementById('zh2latinProgress');
    const zh2latinProgressText = document.getElementById('zh2latinProgressText');
    const latin2zhProgressBar = document.getElementById('latin2zhProgress');
    const latin2zhProgressText = document.getElementById('latin2zhProgressText');

    if (zh2latinProgressBar && zh2latinProgressText) {
        zh2latinProgressBar.style.width = zh2latinProgress + '%';
        zh2latinProgressText.textContent = zh2latinProgress + '%';
    }
    
    if (latin2zhProgressBar && latin2zhProgressText) {
        latin2zhProgressBar.style.width = latin2zhProgress + '%';
        latin2zhProgressText.textContent = latin2zhProgress + '%';
    }
}

// 选择学习模式并跳转到学习页面
function selectMode(mode) {
    console.log('选择模式:', mode);
    // 将选择的模式存储到 sessionStorage
    sessionStorage.setItem('studyMode', mode);
    // 跳转到学习页面
    window.location.href = 'study.html';
}
