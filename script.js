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
    const skipBtn = document.getElementById('skip-btn');
    const waveAudio = document.getElementById('wave-audio');

    // 短時程：降低難度，縮短目標距離
    const TARGET_DISTANCE = 100; 
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
        oceanBackground.classList.remove('playing');
        beachLayer.classList.remove('recede');
        
        const transWave = document.getElementById('wave-transition');
        if (transWave) {
            transWave.classList.remove('sweep-in', 'sweep-out');
        }
        
        // Reset news layer visual state
        newsLayer.scrollTop = 0;
        
        swimmer.className = 'swimmer intro-standby';
        swimmer.style.bottom = '5vh';

        lifesaversContainer.innerHTML = '';
        clickEffects.innerHTML = '';
        diveSplashContainer.innerHTML = '';
        
        clearTimeout(surgeEventTimeout);
        stopGameLoops();
        
        if (waveAudio) {
            waveAudio.pause();
            waveAudio.currentTime = 0;
        }
    }

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gameState !== 'intro') return;
        
        if (waveAudio) {
            waveAudio.volume = 0.4;
            waveAudio.play().catch(()=>{});
        }
        
        gameState = 'cutscene';
        startUI.classList.add('hide');
        swimmer.classList.remove('intro-standby');
        swimmer.classList.add('jump-in');
        
        setTimeout(() => createMegaSplash(), 1800);

        setTimeout(() => {
            gameState = 'playing';
            swimmer.classList.remove('jump-in');
            swimmer.classList.add('playing');
            oceanBackground.classList.add('playing');
            beachLayer.classList.add('recede');
            
            gameUI.classList.remove('hide');
            
            startGameLoops();
            scheduleNextSurge(true); 
        }, 2200);
    });

    function startGameLoops() {
        currentDragInterval = setInterval(() => {
            // 稍微提升難度：將阻力上調，需要更密集的點擊
            let dragForce = 0.15; // 平時阻力：每秒約倒退 3m
            if (isSurgeMode) {
                dragForce = 0.55; // 瘋狗浪阻力：每秒倒退 11m
            }
            
            if (currentDistance > 0) {
                currentDistance -= dragForce;
                if (currentDistance < 0) currentDistance = 0;
            }
            updateProgressUI();
        }, 50); 

        setTimeout(() => {
            if (gameState === 'playing' && Math.random() > 0.1) spawnLifesaver();
        }, 1200);

        lifesaverInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            if (Math.random() > 0.3) { 
                spawnLifesaver();
            }
        }, 2200);
    }

    function stopGameLoops() {
        clearInterval(currentDragInterval);
        clearInterval(lifesaverInterval);
        clearTimeout(surgeEventTimeout);
    }

    // ----------------------------
    // 控制大浪出現：調整第一波的時機與後續頻率
    // ----------------------------
    function scheduleNextSurge(isFirst = false) {
        if (gameState !== 'playing') return;
        
        // 後方浪潮頻率顯著增快 (改為 5~9秒)
        let nextTime = Math.random() * 4000 + 5000; 
        if (isFirst) {
            nextTime = Math.random() * 2000 + 4000; // 第一次稍微往後延: 4秒~6秒出
        }
        
        surgeEventTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;
            
            isSurgeMode = true;
            surgeWarning.classList.remove('hide');
            
            // 浪潮音量上升
            if (waveAudio) increaseVolume(0.8);
            
            // 更柔和的相機搖晃震動
            gameLayer.classList.add('screen-shake');
            setTimeout(() => gameLayer.classList.remove('screen-shake'), 600);

            // 大波浪持續約 3 秒
            setTimeout(() => {
                isSurgeMode = false;
                surgeWarning.classList.add('hide');
                
                // 浪潮音量恢復
                if (waveAudio) decreaseVolume(0.4);
                
                scheduleNextSurge(false);
            }, 3000);

        }, nextTime);
    }
    
    function increaseVolume(targetVolume) {
        if (!waveAudio) return;
        let v = waveAudio.volume;
        const i = setInterval(() => {
            if(v >= targetVolume || gameState !== 'playing') {
                clearInterval(i);
                return;
            }
            v += 0.05;
            if(v > 1) v = 1;
            waveAudio.volume = v;
        }, 100);
    }
    
    function decreaseVolume(targetVolume) {
        if (!waveAudio) return;
        let v = waveAudio.volume;
        const i = setInterval(() => {
            if(v <= targetVolume || gameState !== 'playing') {
                clearInterval(i);
                return;
            }
            v -= 0.05;
            if(v < 0) v = 0;
            waveAudio.volume = v;
        }, 100);
    }

    function updateProgressUI() {
        let percentage = (currentDistance / TARGET_DISTANCE) * 100;
        if (percentage > 100) percentage = 100;
        
        // 修改 UI 寬度顯示
        progressBar.style.width = `${percentage}%`;
        distanceText.textContent = Math.floor(currentDistance);

        // 重頭戲：救生員真的會往前（讓其 Y 軸位置隨進度向上游動）
        // 初始高度大約 5vh，最高游到 70vh
        if (gameState === 'playing' || gameState === 'intro') {
            swimmer.style.bottom = `${5 + (percentage * 0.65)}vh`;
        }

        if (currentDistance >= TARGET_DISTANCE && gameState === 'playing') {
            triggerWin();
        }
    }

    function spawnLifesaver() {
        const lifesaver = document.createElement('div');
        lifesaver.classList.add('lifesaver');
        const randomX = Math.random() * 60 + 15;
        lifesaver.style.left = `${randomX}%`;
        
        // 寫實、專業的新聞視覺風格：傳統圓形救生圈
        lifesaver.innerHTML = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                <defs>
                    <filter id="buoy-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="8" stdDeviation="4" flood-color="#000" flood-opacity="0.25"/>
                    </filter>
                </defs>
                <g filter="url(#buoy-shadow)">
                    <!-- 白色基底圈 -->
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#f8fafc" stroke-width="18" />
                    <!-- 紅色反光條段落 (利用 dasharray 創造 4 段紅色) -->
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#ef4444" stroke-width="18" stroke-dasharray="25.1 25.1" transform="rotate(22.5 50 50)" />
                    <!-- 救生圈外圍的繩索 -->
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#cbd5e1" stroke-width="1.5" />
                    <!-- 繩索固定扣 -->
                    <circle cx="50" cy="18" r="3" fill="#475569" />
                    <circle cx="50" cy="82" r="3" fill="#475569" />
                    <circle cx="18" cy="50" r="3" fill="#475569" />
                    <circle cx="82" cy="50" r="3" fill="#475569" />
                </g>
            </svg>
        `;
        
        lifesaver.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'playing') return;
            
            // 救生圈推進力，慢節奏
            currentDistance += 15;
            updateProgressUI();

            createFloatingText(e.clientX, e.clientY, "+15m 推進");
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
        
        // 點擊力道，配合極低的阻力
        currentDistance += 1.0; 
        swimmerDash();
        updateProgressUI();
        createRipple(e.clientX, e.clientY);
    });

    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                initGame();
            }, 500);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent game click
            if (gameState === 'playing') {
                triggerWin();
            }
        });
    }

    function triggerWin() {
        gameState = 'finished';
        stopGameLoops();
        distanceText.textContent = TARGET_DISTANCE;
        if (waveAudio) decreaseVolume(0.0);
        
        // 抵達終點後稍作停頓，讓救生員在終點稍微定格一下 (微調為 0.8秒)
        setTimeout(() => {
            const transWave = document.getElementById('wave-transition');
            
            // 在海浪啟動的瞬間，先讓遊戲 UI 消失
            const gameUI = document.getElementById('game-ui');
            const startUI = document.getElementById('start-ui');
            const surgeWarn = document.getElementById('surge-warning');
            if (gameUI) gameUI.classList.add('hide');
            if (startUI) startUI.classList.add('hide');
            if (surgeWarn) surgeWarn.classList.add('hide');
            
            // 啟動海浪
            if (transWave) transWave.classList.add('sweep-in');
            
            // 海浪飛過中，瞬間移除底層所有東西的可見度
            setTimeout(() => {
                if (gameLayer) {
                    gameLayer.style.display = 'none';
                    gameLayer.style.visibility = 'hidden';
                }
                
                if (newsLayer) {
                    newsLayer.classList.remove('hide');
                    newsLayer.classList.add('show');
                }
                window.scrollTo(0, 0);
            }, 600); 

            // 清除海浪
            setTimeout(() => {
                if (transWave) {
                    transWave.style.transition = 'none';
                    transWave.classList.remove('sweep-in');
                    transWave.offsetHeight; 
                    transWave.style.transition = '';
                }
            }, 1400); 
            
        }, 800); // 將 1200ms 縮短為 800ms，讓節奏稍微快一點
    }

});
