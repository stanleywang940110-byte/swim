document.addEventListener('DOMContentLoaded', () => {
    const gameLayer = document.getElementById('game-layer');
    const startUI = document.getElementById('start-ui');
    const startBtn = document.getElementById('start-btn');
    const gameUI = document.getElementById('game-ui');
    const beachLayer = document.getElementById('beach-layer');
    const oceanBackground = document.querySelector('.ocean-background');
    const surgeWarning = document.getElementById('surge-warning');
    
    const newsLayer = document.getElementById('news-layer');
    const progressBar = document.getElementById('progress-bar');
    const distanceText = document.getElementById('distance-text');
    const swimmer = document.getElementById('swimmer');
    const lifesaversContainer = document.getElementById('lifesavers-container');
    const clickEffects = document.getElementById('click-effects');
    const diveSplashContainer = document.getElementById('dive-splash-container');
    const replayBtn = document.getElementById('replay-btn');

    // 短時程
    const TARGET_DISTANCE = 130; 
    let currentDistance = 0;
    
    let gameState = 'intro';
    let currentDragInterval = null;
    let lifesaverInterval = null;
    let surgeEventTimeout = null;
    
    let isSurgeMode = false;

    initGame();

    function initGame() {
        gameState = 'intro';
        currentDistance = 0;
        isSurgeMode = false;
        updateProgressUI();
        
        gameLayer.classList.remove('fade-out', 'screen-shake');
        gameLayer.style.display = 'block';
        
        startUI.classList.remove('hide');
        gameUI.classList.add('hide');
        surgeWarning.classList.add('hide');
        newsLayer.classList.add('hide');
        newsLayer.classList.remove('show');
        oceanBackground.classList.remove('surge');
        
        beachLayer.classList.remove('recede');
        swimmer.className = 'swimmer intro-standby';

        lifesaversContainer.innerHTML = '';
        clickEffects.innerHTML = '';
        diveSplashContainer.innerHTML = '';
        
        clearTimeout(surgeEventTimeout);
        stopGameLoops();
    }

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gameState !== 'intro') return;
        
        gameState = 'cutscene';
        startUI.classList.add('hide');
        swimmer.classList.remove('intro-standby');
        swimmer.classList.add('jump-in');
        
        setTimeout(() => createMegaSplash(), 1800);

        setTimeout(() => {
            gameState = 'playing';
            swimmer.classList.remove('jump-in');
            swimmer.classList.add('playing');
            
            beachLayer.classList.add('recede');
            gameUI.classList.remove('hide');
            
            startGameLoops();
            scheduleNextSurge(); 
        }, 2200);
    });

    function startGameLoops() {
        currentDragInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            
            let dragForce = 0.6; 
            if (isSurgeMode) {
                dragForce = 2.4; 
            }
            
            if (currentDistance > 0) {
                currentDistance -= dragForce;
                if (currentDistance < 0) currentDistance = 0;
            }
            updateProgressUI();
        }, 50); 

        lifesaverInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            if (Math.random() > 0.3) { 
                spawnLifesaver();
            }
        }, 2800);
    }

    function stopGameLoops() {
        clearInterval(currentDragInterval);
        clearInterval(lifesaverInterval);
        clearTimeout(surgeEventTimeout);
    }

    // ----------------------------
    // 降低大浪出現頻率：拉長 Timer
    // ----------------------------
    function scheduleNextSurge() {
        if (gameState !== 'playing') return;
        
        // 從原本的 4~7 秒調升至 10~15 秒才會出現一次
        const nextTime = Math.random() * 5000 + 10000; 
        
        surgeEventTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;
            
            isSurgeMode = true;
            surgeWarning.classList.remove('hide');
            oceanBackground.classList.add('surge');
            
            // 更柔和的相機搖晃震動
            gameLayer.classList.add('screen-shake');
            setTimeout(() => gameLayer.classList.remove('screen-shake'), 600);

            // 大波浪持續約 3 秒
            setTimeout(() => {
                isSurgeMode = false;
                surgeWarning.classList.add('hide');
                oceanBackground.classList.remove('surge');
                scheduleNextSurge();
            }, 3000);

        }, nextTime);
    }

    function updateProgressUI() {
        let percentage = (currentDistance / TARGET_DISTANCE) * 100;
        if (percentage > 100) percentage = 100;
        
        // 修改寬度綁定
        progressBar.style.width = `${percentage}%`;
        distanceText.textContent = Math.floor(currentDistance);

        if (currentDistance >= TARGET_DISTANCE && gameState === 'playing') {
            triggerWin();
        }
    }

    function spawnLifesaver() {
        const lifesaver = document.createElement('div');
        lifesaver.classList.add('lifesaver');
        const randomX = Math.random() * 60 + 15;
        lifesaver.style.left = `${randomX}%`;
        
        // 修改為無黑框的極簡圓潤風格
        lifesaver.innerHTML = `
            <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                <g>
                    <!-- 極簡的圓潤風格 (無黑線框) -->
                    <rect x="10" y="30" width="180" height="40" rx="20" fill="#ef4444"/>
                    <rect x="30" y="20" width="20" height="60" rx="10" fill="#dc2626"/>
                    <rect x="150" y="20" width="20" height="60" rx="10" fill="#dc2626"/>
                    <text x="60" y="56" fill="#ffffff" font-family="'Noto Sans TC', sans-serif" font-weight="900" font-size="22" letter-spacing="1">RESCUE</text>
                </g>
            </svg>
        `;
        
        lifesaver.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'playing') return;
            
            currentDistance += 25;
            updateProgressUI();

            createFloatingText(e.clientX, e.clientY, "+25m 推進");
            createRipple(e.clientX, e.clientY);
            swimmerDash();
            
            lifesaver.style.animation = 'none'; 
            lifesaver.style.transition = 'all 0.2s';
            lifesaver.style.opacity = '0';
            lifesaver.style.transform = 'scale(2.5) rotate(45deg)';
            setTimeout(() => lifesaver.remove(), 200);
        });

        lifesaversContainer.appendChild(lifesaver);

        setTimeout(() => {
            if (lifesaver.parentElement) lifesaver.remove();
        }, 4500);
    }

    function createMegaSplash() {
        const splash = document.createElement('div');
        splash.classList.add('mega-splash');
        diveSplashContainer.appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
    }

    function createFloatingText(x, y, text) {
        const floatText = document.createElement('div');
        floatText.classList.add('floating-text');
        floatText.textContent = text;
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y}px`;
        
        clickEffects.appendChild(floatText);
        setTimeout(() => floatText.remove(), 1200);
    }

    function swimmerDash() {
        swimmer.classList.add('dash');
        setTimeout(() => {
            if (gameState !== 'playing') return;
            swimmer.classList.remove('dash');
        }, 300);
    }

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        clickEffects.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    gameLayer.addEventListener('click', (e) => {
        if (gameState !== 'playing') return;
        
        currentDistance += 3.0; 
        swimmerDash();
        updateProgressUI();
        createRipple(e.clientX, e.clientY);
    });

    replayBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            initGame();
        }, 500);
    });

    function triggerWin() {
        gameState = 'finished';
        stopGameLoops();
        distanceText.textContent = TARGET_DISTANCE;
        
        setTimeout(() => {
            gameLayer.classList.add('fade-out');
            setTimeout(() => {
                gameLayer.style.display = 'none';
                newsLayer.classList.remove('hide');
                newsLayer.classList.add('show');
                window.scrollTo(0, 0);
            }, 1000); 
        }, 600); 
    }
});
