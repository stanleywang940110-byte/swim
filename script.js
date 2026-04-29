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
        
        // 核心修正：確保 game-layer 徹底回到初始狀態 (display 與 visibility)
        gameLayer.classList.remove('fade-out', 'screen-shake');
        gameLayer.style.display = 'block';
        gameLayer.style.visibility = 'visible'; 
        gameLayer.style.opacity = '1';
        
        startUI.classList.remove('hide');
        gameUI.classList.add('hide');
        surgeWarning.classList.add('hide');
        
        // 隱藏新聞層
        newsLayer.classList.add('hide');
        newsLayer.classList.remove('show');
        
        oceanBackground.classList.remove('surge', 'playing');
        beachLayer.classList.remove('recede');
        
        const transWave = document.getElementById('wave-transition');
        if (transWave) {
            transWave.classList.remove('sweep-in', 'sweep-out');
        }
        
        // 重置捲軸
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
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
        
        setTimeout(() => {
            const transWave = document.getElementById('wave-transition');
            const gameUI = document.getElementById('game-ui');
            const startUI = document.getElementById('start-ui');
            const surgeWarn = document.getElementById('surge-warning');
            if (gameUI) gameUI.classList.add('hide');
            if (startUI) startUI.classList.add('hide');
            if (surgeWarn) surgeWarn.classList.add('hide');
            
            if (transWave) transWave.classList.add('sweep-in');
            
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

            setTimeout(() => {
                if (transWave) {
                    transWave.style.transition = 'none';
                    transWave.classList.remove('sweep-in');
                    transWave.offsetHeight; 
                    transWave.style.transition = '';
                }
            }, 1400); 
        }, 800);
    }

    // ======================================================
    // 🎮 第二階段：各國救生體制大考驗 (Game 2 Logic)
    // ======================================================

    const gameLayer2 = document.getElementById('game-layer-2');
    
    // --- 資料集 ---
    const sortItems2 = [
        { text: "150cm 靜水平靜泳池", ans: "tw" },
        { text: "真實波浪與沙灘海域", ans: "au" },
        { text: "熱衰竭與毒水母緊急處置", ans: "au" },
        { text: "開放水域失溫應變", ans: "au" },
        { text: "拖帶靜止死板假人", ans: "tw" },
        { text: "平地拋繩與長背板固定", ans: "tw" },
        { text: "無線電通報與動力載具", ans: "au" },
        { text: "單人游泳測驗秒數競爭", ans: "tw" },
        { text: "講求規範的單人 CPR 流程", ans: "tw" },
        { text: "團隊作戰與患者安全交接", ans: "au" },
        { text: "發配流線型救生板", ans: "au" },
        { text: "限時內游至池底打撈", ans: "tw" }
    ];

    const severityData2 = [
        {
            envTitle: "深 150cm 平靜泳池", envTag: "安全可控 / 封閉環境",
            tw: { state: "state-safe", status: "正式上崗游刃有餘", color: "#4ade80", skills: ["台灣唯一核發證照", "熟悉單人CPR與長背板", "200m 限時完賽", "專考 25m 單人假人拖拉"] },
            de: { state: "state-safe", badge: "badge-bronze", title: "🇩🇪 德國銅級徽章", status: "能力達標 (無法定執業)", color: "#cd7f32", skills: ["純屬個人自救協助", "掌握基礎單人 CPR", "200m 徒手(限時10分)", "著重仰泳與入水打撈"] }
        },
        {
            envTitle: "開放海灘發生溺水", envTag: "浪況折損 / 活體掙扎",
            tw: { state: "state-warn", status: "瀕臨極限 (自溺風險)", color: "#f59e0b", skills: ["⚠️ 無受過活人拖帶測試", "⚠️ 遇真實掙扎極易遭拖沉", "缺乏進階裝備仰賴踩水", "無法破浪體力流失極快"] },
            de: { state: "state-safe", badge: "badge-silver", title: "🇩🇪 德國銀級徽章", status: "能力擴充正式上線", color: "#cbd5e1", skills: ["晉升法規認可用於執業", "海洋耐力攀升至 400m", "考驗極困難 50m 活人拖帶", "具備九單元進階急救證"] }
        },
        {
            envTitle: "惡劣天候外海搜救", envTag: "極限環境 / 特殊救援",
            tw: { state: "state-danger", status: "裝備歸零危及生命", color: "#ff6b6b", skills: ["❌ 缺乏無武裝長浪推進力", "❌ 缺乏『著衣游泳解脫』", "❌ 無強制每年更新醫學證明", "⚠️ 受迫下水即公然玩命"] },
            de: { state: "state-safe", badge: "badge-gold", title: "🇩🇪 德國金級徽章", status: "技術精熟高超能力", color: "#fbbf24", skills: ["佩裝『大蛙鞋』游 300m", "100m 水中 1分40秒 內衝刺", "能執行特殊著衣活體拖帶", "嚴格要求年度執業醫學證明"] }
        }
    ];

    // --- 畫布模擬系統 ---
    const canvas2 = document.getElementById("canvas-2");
    const ctx2 = canvas2.getContext("2d");
    let w2, h2, t2 = 0, amplitude2 = 20, speed2 = 0.01;

    function resize2() {
        w2 = canvas2.width = window.innerWidth;
        h2 = canvas2.height = window.innerHeight;
    }
    window.addEventListener("resize", resize2);
    resize2();

    function draw2() {
        ctx2.clearRect(0, 0, w2, h2);
        const grad = ctx2.createLinearGradient(0, 0, 0, h2);
        grad.addColorStop(0, "rgba(56,189,248,0.25)"); grad.addColorStop(1, "rgba(2,132,199,0.6)");
        ctx2.beginPath();
        for (let x = 0; x < w2; x++) {
            let y = h2 * 0.65 + Math.sin(x * 0.004 - t2) * amplitude2 + Math.sin(x * 0.008 - t2 * 1.2) * amplitude2 * 0.5;
            if (x === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.lineTo(w2, h2); ctx2.lineTo(0, h2); ctx2.closePath();
        ctx2.fillStyle = grad; ctx2.fill();
        
        ctx2.beginPath();
        for (let x = 0; x < w2; x++) {
            let y = h2 * 0.65 + Math.sin(x * 0.004 - t2) * amplitude2 + Math.sin(x * 0.008 - t2 * 1.2) * amplitude2 * 0.5;
            if (x === 0) ctx2.moveTo(x, y - 1); else ctx2.lineTo(x, y - 1);
        }
        ctx2.strokeStyle = "rgba(255,255,255,0.25)"; ctx2.lineWidth = 1; ctx2.stroke();
        
        t2 += speed2;
        requestAnimationFrame(draw2);
    }
    draw2();

    // --- 全局接口 ---
    window.openGame2 = function() {
        const transWave = document.getElementById('wave-transition');
        if (transWave) transWave.classList.add('sweep-in');
        
        setTimeout(() => {
            newsLayer.classList.add('hide');
            gameLayer2.classList.remove('hide');
            window.scrollTo(0, 0);
            goToGame2('start');
        }, 600);

        setTimeout(() => {
            if (transWave) transWave.classList.remove('sweep-in');
        }, 1400);
    };

    window.closeGame2 = function() {
        const transWave = document.getElementById('wave-transition');
        if (transWave) transWave.classList.add('sweep-in');
        
        setTimeout(() => {
            gameLayer2.classList.add('hide');
            newsLayer.classList.remove('hide');
            // 回到原本的按鈕位置 (大約在報導中間)
            const cta = document.querySelector('.cta-section');
            if (cta) cta.scrollIntoView();
        }, 600);

        setTimeout(() => {
            if (transWave) transWave.classList.remove('sweep-in');
        }, 1400);
    };

    let currentSortIdx2 = 0, isAnimating2 = false, gameTimer2;
    const TIME_LIMIT2 = 20;

    window.goToGame2 = function(screenId) {
        document.querySelectorAll('.screen-2').forEach(s => s.classList.remove('active'));
        const target = document.getElementById('screen-' + screenId + '-2');
        if (target) target.classList.add('active');
        
        const svg = document.getElementById('svg-ocean-2');
        const cvs = document.getElementById('canvas-2');
        
        if (screenId.includes('lvl2')) {
            if (svg) svg.style.opacity = 0;
            if (cvs) cvs.style.opacity = 1;
        } else {
            if (svg) svg.style.opacity = 0.5;
            if (cvs) cvs.style.opacity = 0;
        }
        
        if (screenId === 'lvl1') initSortGame2();
        if (screenId === 'lvl2') updateThreatLevelGame2(1);
    };

    function initSortGame2() {
        sortItems2.sort(() => Math.random() - 0.5);
        currentSortIdx2 = 0;
        document.getElementById('box-tw-2').innerHTML = "";
        document.getElementById('box-au-2').innerHTML = "";
        document.getElementById('lvl1-next-btn-2').style.display = "none";
        document.querySelector('.sorting-bins-2').style.opacity = 1;
        document.querySelector('.sorting-bins-2').style.pointerEvents = "auto";
        
        const tbar = document.getElementById('timer-bar-2');
        tbar.style.transition = "none";
        tbar.style.transform = "scaleX(1)";
        setTimeout(() => {
            tbar.style.transition = `transform ${TIME_LIMIT2}s linear`;
            tbar.style.transform = "scaleX(0)";
            gameTimer2 = setTimeout(forceGameEnd2, TIME_LIMIT2 * 1000);
        }, 50);
        loadNextSortItem2();
    }

    function loadNextSortItem2() {
        const card = document.getElementById('sort-card-2');
        if (currentSortIdx2 >= sortItems2.length) {
            clearTimeout(gameTimer2);
            document.getElementById('timer-bar-2').style.transition = "none";
            card.innerText = "✅ 全部分類完畢！";
            document.getElementById('lvl1-next-btn-2').style.display = "block";
            document.querySelector('.sorting-bins-2').style.opacity = 0.3;
            document.querySelector('.sorting-bins-2').style.pointerEvents = "none";
            return;
        }
        card.className = "sort-card-2";
        card.innerText = sortItems2[currentSortIdx2].text;
        card.style.opacity = 1;
        isAnimating2 = false;
    }

    window.sortToGame2 = function(choice) {
        if (isAnimating2 || currentSortIdx2 >= sortItems2.length) return;
        isAnimating2 = true;
        const item = sortItems2[currentSortIdx2];
        const card = document.getElementById('sort-card-2');
        
        if (choice === item.ans) {
            card.classList.add(choice === 'tw' ? 'fly-tw-2' : 'fly-au-2');
            setTimeout(() => {
                const tag = document.createElement('div');
                tag.className = 'sorted-tag-2 ' + (choice === 'tw' ? 'tw-tag-2' : 'au-tag-2');
                tag.innerText = item.text;
                document.getElementById('box-' + choice + '-2').appendChild(tag);
                currentSortIdx2++;
                loadNextSortItem2();
            }, 200);
        } else {
            card.classList.add('shake-2');
            const correct = item.ans === 'tw' ? '台灣體制' : '澳洲與加拿大';
            card.innerHTML = `<div style="color:#fca5a5; font-size:12px; margin-bottom:5px;">配置錯誤</div><div style="font-size:12px;">「${item.text}」屬於 ${correct}</div>`;
            setTimeout(() => {
                card.classList.remove('shake-2');
                card.classList.add(item.ans === 'tw' ? 'fly-tw-2' : 'fly-au-2');
                setTimeout(() => {
                    const tag = document.createElement('div');
                    tag.className = 'sorted-tag-2 ' + (item.ans === 'tw' ? 'tw-tag-2' : 'au-tag-2');
                    tag.innerText = item.text;
                    document.getElementById('box-' + item.ans + '-2').appendChild(tag);
                    currentSortIdx2++;
                    loadNextSortItem2();
                }, 300);
            }, 1200);
        }
    };

    function forceGameEnd2() {
        if (currentSortIdx2 >= sortItems2.length) return;
        const card = document.getElementById('sort-card-2');
        card.innerText = "⏱️ 調度超時！揭曉真相...";
        let delay = 0;
        while (currentSortIdx2 < sortItems2.length) {
            const item = sortItems2[currentSortIdx2];
            setTimeout(() => {
                const div = document.createElement('div');
                div.className = "reveal-item-2";
                div.innerText = item.text;
                document.getElementById('box-' + item.ans + '-2').appendChild(div);
            }, delay);
            delay += 150;
            currentSortIdx2++;
        }
        setTimeout(() => {
            card.innerText = "✅ 已揭曉正確分級";
            document.getElementById('lvl1-next-btn-2').style.display = "block";
        }, delay + 1200);
    }

    window.updateThreatLevelGame2 = function(val) {
        let v = parseInt(val);
        amplitude2 = 10 + v * 0.6;
        speed2 = 0.005 + v * 0.0003;
        let d = (v <= 33) ? severityData2[0] : (v <= 66 ? severityData2[1] : severityData2[2]);
        
        document.getElementById('env-title-2').innerText = d.envTitle;
        document.getElementById('env-tag-2').innerText = d.envTag;
        
        const twCard = document.getElementById('tw-card-2');
        twCard.className = "c-card-2 " + d.tw.state;
        document.getElementById('tw-status-2').innerText = d.tw.status;
        document.getElementById('tw-status-2').style.color = d.tw.color;
        document.getElementById('tw-skills-2').innerHTML = d.tw.skills.map(s => `<li>${s}</li>`).join('');
        
        const deCard = document.getElementById('de-card-2');
        deCard.className = "c-card-2 " + d.de.state;
        document.getElementById('de-title-2').innerText = d.de.title;
        document.getElementById('de-status-2').innerText = d.de.status;
        document.getElementById('de-status-2').style.color = d.de.color;
        document.getElementById('de-skills-2').innerHTML = d.de.skills.map(s => `<li>${s}</li>`).join('');
    };

});
