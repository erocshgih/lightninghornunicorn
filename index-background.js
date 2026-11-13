
        (function initBackground() {
            const mcanvas = document.getElementById("matrix-bg");
            const mctx = mcanvas.getContext("2d", { alpha: false });
            const DOWNSCALE = 0.6;
            let W, H, cx, cy;
            let currentBgIndex = 0;
            window.isTrafficConePhase = false;
            let stars = [], balls = [], conesArr = [];
            
            const LHU_WORDS = ["AETHER", "VEDRAN", "DNA 🧬", "BLITZ ⚡", "INTELLIGENCE", "ART", "SOUND", "PERSONA", "SCIENCE", "UNICORN", "ROBOT", "IMAGINATION", "AESTHETICS"];
            let currentWordIdx = 0, wordTimer = 0;

            const ballCanvases = [];
            const ballColors = [ ['#fff', '#ff3333', '#390000'], ['#fff', '#ffd400', '#3e3000'], ['#fff', '#33bbff', '#00162f'] ];
            ballColors.forEach(c => {
                let cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
                let ctx = cv.getContext('2d');
                let g = ctx.createRadialGradient(24, 24, 4, 32, 32, 30);
                g.addColorStop(0, c[0]); g.addColorStop(0.3, c[1]); g.addColorStop(1, c[2]);
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(32,32,30,0,Math.PI*2); ctx.fill();
                ballCanvases.push(cv);
            });

            const coneCanvas = document.createElement('canvas');
            coneCanvas.width = 64; coneCanvas.height = 64;
            const cctx = coneCanvas.getContext('2d');
            cctx.font = '50px sans-serif'; cctx.textAlign = 'center'; cctx.textBaseline = 'middle';
            cctx.fillText('🚧', 32, 32);

            function initTheme() {
                W = mcanvas.width = Math.floor(innerWidth * DOWNSCALE);
                H = mcanvas.height = Math.floor(innerHeight * DOWNSCALE);
                cx = W / 2; cy = H / 2;

                stars = [];
                for(let i=0; i<35; i++) stars.push({ x: (Math.random()-0.5)*W*2, y: (Math.random()-0.5)*H*2, z: Math.random()*1000 + 1, s: Math.random()*3+2 });

                balls = [];
                for(let i=0; i<18; i++) balls.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, s: Math.random()*35 + 20, img: ballCanvases[Math.floor(Math.random()*ballCanvases.length)] });

                conesArr = [];
                for(let i=0; i<25; i++) conesArr.push({ x: Math.random()*W, y: Math.random()*H, s: Math.random()*30 + 30, speed: Math.random()*3 + 2 });
            }

            window.setMatrixTheme = function(index) { currentBgIndex = index; initTheme(); };
            document.getElementById("bg-prev").addEventListener("click", () => { currentBgIndex = (currentBgIndex - 1 + 3) % 3; window.setMatrixTheme(currentBgIndex); });
            document.getElementById("bg-next").addEventListener("click", () => { currentBgIndex = (currentBgIndex + 1) % 3; window.setMatrixTheme(currentBgIndex); });

            let bgAnimationFrame = null;
            let bgActive = true;

            function drawBg() {
                bgAnimationFrame = null;
                if (!bgActive || document.hidden || document.body.classList.contains('site-mode')) return;

                mctx.fillStyle = "#04050a";
                mctx.fillRect(0, 0, W, H);

                if (window.isTrafficConePhase) {
                    for (let c of conesArr) {
                        c.y += c.speed;
                        if (c.y > H + 50) { c.y = -50; c.x = Math.random() * W; }
                        mctx.drawImage(coneCanvas, c.x, c.y, c.s, c.s);
                    }
                } else {
                    if (currentBgIndex === 0) {
                        mctx.fillStyle = "#fff"; mctx.textAlign = "center"; mctx.textBaseline = "middle";
                        for (let p of stars) {
                            p.z -= p.s;
                            if (p.z <= 1) { p.x = (Math.random()-0.5)*W*2; p.y = (Math.random()-0.5)*H*2; p.z = 1000; continue; }
                            let scale = 300 / p.z;
                            let px = cx + p.x * scale; let py = cy + p.y * scale;
                            if (px < -50 || px > W + 50 || py < -50 || py > H + 50) { p.z = 1000; continue; }
                            let size = Math.max(2, 25 * scale); mctx.font = `bold ${size}px monospace`; mctx.fillText("7", px, py);
                        }
                    } else if (currentBgIndex === 1) {
                        wordTimer++;
                        if(wordTimer > 200) { currentWordIdx = (currentWordIdx + 1) % LHU_WORDS.length; wordTimer = 0; }
                        const word = LHU_WORDS[currentWordIdx]; const fontSize = Math.max(30, W / 10);
                        mctx.font = `bold ${fontSize}px "Press Start 2P", sans-serif`; mctx.textAlign = "center"; mctx.textBaseline = "middle";
                        let positions = [H * 0.15, H * 0.50, H * 0.85]; let t = Date.now() * 0.0015; 
                        for (let i = 0; i < 3; i++) {
                            let py = positions[i]; let wobbleX = Math.sin(t * 2 + i) * 15; let glitch = Math.sin(t * 4 + i) * 5;   
                            mctx.globalAlpha = 0.8; mctx.fillStyle = "#00ffff"; mctx.fillText(word, cx + wobbleX - glitch, py);
                            mctx.fillStyle = "#ff00ff"; mctx.fillText(word, cx + wobbleX + glitch, py);
                            mctx.globalAlpha = 1.0; mctx.fillStyle = "#ffffff"; mctx.fillText(word, cx + wobbleX, py);
                        }
                    } else if (currentBgIndex === 2) {
                        for (let p of balls) {
                            p.x += p.vx; p.y += p.vy;
                            if (p.x < 0 || p.x > W) p.vx *= -1;
                            if (p.y < 0 || p.y > H) p.vy *= -1;
                            mctx.drawImage(p.img, p.x - p.s/2, p.y - p.s/2, p.s, p.s);
                        }
                    }
                }
                bgAnimationFrame = requestAnimationFrame(drawBg);
            }

            window.__lhuPauseMatrixBackground = function() {
                bgActive = false;
                if (bgAnimationFrame !== null) cancelAnimationFrame(bgAnimationFrame);
                bgAnimationFrame = null;
            };
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (bgAnimationFrame !== null) cancelAnimationFrame(bgAnimationFrame);
                    bgAnimationFrame = null;
                } else if (bgActive && !document.body.classList.contains('site-mode') && bgAnimationFrame === null) {
                    drawBg();
                }
            });

            initTheme(); drawBg();
            window.addEventListener("resize", () => { clearTimeout(window._resizeT); window._resizeT = setTimeout(initTheme, 200); });
        })();
    