
        import * as THREE from "https://esm.sh/three@0.160.0";
        import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
        import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
        import { DRACOLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

        // Share this exact Three.js runtime with dynamically loaded HUMANART content.
        // The facade preserves the THREE.OrbitControls API expected by 03_humanart.html.
        window.THREE = Object.assign({}, THREE, { OrbitControls });
        window.LHU_THREE_REVISION = THREE.REVISION;

        const getDPR = () => {
            const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
            const dpr = window.devicePixelRatio || 1;
            return isMobile ? Math.min(dpr, 1.25) : Math.min(dpr, 1.5);
        };

        const isGerman = (navigator.language || navigator.userLanguage).toLowerCase().startsWith('de');
        const translations = {
            en: { playMusic: "Play Music", stopMusic: "Stop Music", mainPage: "Main Page", introHint: "Press a button", loading: "LOADING" },
            de: { playMusic: "Musik abspielen", stopMusic: "Musik stoppen", mainPage: "Hauptseite", introHint: "Drücke einen Knopf", loading: "LÄDT" }
        };
        const t = isGerman ? translations.de : translations.en;

        document.getElementById("music-toggle").textContent = t.playMusic;
        document.getElementById("navigate-to-main").textContent = t.mainPage;
        document.getElementById("lhu-intro-hint").textContent = t.introHint;
        // Loading-Beschriftung kommt jetzt zentral aus window.LHU.Loader.

        const dailyWisdom = {
            en: [
                "The early bird catches the worm. Because the worm has no basic radar system.",
                "Blood is thicker than water so vampires must be obese.",
                "get more comfortable... become furniture",
                "your bones called... they are calcium",
                "What doesn't kill you makes you stronger. That's a lie invented by bears so you fight them unarmed.",
                "dont move: now your shadow is unemployed",
                "Give your meat a good old slap if you are not a robot",
                "Forgive me I learn daily... that you massage dead cows with salt and fire, just to turn them into poop later",
                "but who is gay... but who asked first",
                "Your problem has a solution. They are divorced.",
                "I walk with God, but he usually takes the bus. How else would the bus exist except through God's love only (and human craftsmanship obviously)...",
                "Doctor said: You did not forget your password. That's dehydration from explosive diarrhea.",
                "If you can't sleep, read your local hobo a good night story while you invite them to a pyjama party.",
                "One apple a day keeps the doctor away if you throw it fast enough at him...",
                "You look like you don't have it all together is what you say to me huh Very interesting You seem like someone who could be nice to other people but you are not. Looks can be deceiving",
                "If man today can borrow flora, woman tomorrow will not him give choira.",
                "Ra, ra, Rasputin, unstoppable goon machine, his pp drinks gasoline,burns now limp and mean. Canceled...",
                "Please support living artists. Vienna markets dead legends while living artists struggle for attention. Mozart, Zombie Falco, and Manner wafers: Is that the full extent of your cultural imagination?",
                "If a man says viruses are not your Friends is this man the antivirus."
            ],
            de: [
                "Der frühe Vogel fängt den Wurm. Weil der Wurm kein grundlegendes Radarsystem hat.",
                "Blut ist dicker als Wasser, also müssen Vampire fettleibig sein.",
                "mach es dir bequemer... werde zu möbeln",
                "deine knochen haben angerufen... sie sind kalzium",
                "Was dich nicht umbringt, macht dich stärker. Das ist eine Lüge, die von Bären erfunden wurde, damit du unbewaffnet gegen sie antrittst.",
                "beweg dich nicht: jetzt ist dein schatten arbeitslos",
                "gib deinem fleisch einen guten alten klaps, wenn du kein roboter bist",
                "vergib mir, ich lerne täglich... dass ihr tote kühe mit salz und feuer massiert, nur um sie später in kacke zu verwandeln",
                "aber wer ist gay... aber wer hat zuerst gefragt",
                "Dein Problem hat eine Lösung. Sie sind geschieden.",
                "Ich gehe mit Gott, aber er nimmt meistens den Bus. Wie sonst würde der Bus existieren, außer allein durch Gottes Liebe (und menschliche Handwerkskunst offensichtlich)...",
                "Doktor sagt: Du hast dein Passwort nicht vergessen. Das ist Dehydrierung durch explosiven Durchfall.",
                "Wenn du nicht schlafen kannst, lies dem örtlichen Landstreicher eine Gute-Nacht-Geschichte vor, während du ihn zu einer Pyjamaparty einlädst.",
                "Ein Apfel am Tag hält den Arzt fern, wenn du ihn schnell genug auf ihn wirfst...",
                "Du siehst aus, als hättest du dein Leben nicht im Griff, sagst du also zu mir, huh Sehr interessant Du wirkst wie jemand, der nett zu anderen Menschen sein könnte, aber du bist es nicht. Der Schein kann trügen",
                "Wenn du heute kann Blumen borgen, dann Frau morgen nicht dein Pipi entsorgen.",
                "Ra, ra, Rasputin, unbändige Lust-machine, sein Bart hat mehr erlebt als die Kantine hat gebebt.",
                "Bitte unterstützt lebende Künstler. Wien vermarktet tote Legenden, während lebende Künstler um Aufmerksamkeit kämpfen. Mozart, Zombie-Falco und Mannerschnitten: Ist das eure ganze kulturelle Fantasie?",
                "Wenn ein Mann sagt, Viren sind nicht deine Freunde, ist dieser Mann dann das Antivirus?..."
            ]
        };

        let availableWisdomIndices = [];
        let currentWisdomLang = '';
        let isTyping = false; 

        const wisdomCounterEl = document.getElementById('quote-counter');
        const wisdomBtn = document.getElementById('wisdom-btn');

        function updateWisdomCounter(bump = false) {
            if (!wisdomCounterEl) return;
            const lang = isGerman ? 'de' : 'en';
            if (currentWisdomLang !== lang) {
                currentWisdomLang = lang;
                availableWisdomIndices = dailyWisdom[lang].map((_, i) => i);
            }
            const displayCount = availableWisdomIndices.length === 0 ? dailyWisdom[lang].length : availableWisdomIndices.length;
            wisdomCounterEl.textContent = displayCount;

            if (bump) {
                wisdomCounterEl.classList.add('bump');
                setTimeout(() => wisdomCounterEl.classList.remove('bump'), 150);
            }
        }
        
        updateWisdomCounter();

        const toggleModal = (id, show) => {
            const el = document.getElementById(id);
            if (show) el.classList.add("show");
            else el.classList.remove("show");
        };

        const disclaimerTexts = {
            de: "Diese Inhalte stellen fiktive Parodien zu Unterhaltungszwecken dar und repräsentieren nicht die Ansichten, Überzeugungen oder Absichten von Einzelpersonen oder Entitäten.",
            en: "These statements constitute fictional parody for entertainment purposes only and do not represent the views, beliefs, or intentions of any individual or entity."
        };
        document.getElementById("disclaimer-text").textContent = isGerman ? disclaimerTexts.de : disclaimerTexts.en;
        
        document.getElementById("disclaimer-btn").onclick = () => toggleModal("disclaimer-modal", true);
        document.getElementById("close-disclaimer").onclick = () => toggleModal("disclaimer-modal", false);
        document.getElementById("quote-btn").onclick = () => toggleModal("quote-modal", true);
        document.getElementById("close-quote").onclick = () => toggleModal("quote-modal", false);

        const MODELS = [
            { label: "unibrowserloadicorn", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/unibrowserloadicorn.glb" },
            { label: "uniturnoeyeballhorn", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/uniturnoeyeballhorn.glb" },
            { label: "duckybulbywaterhorn", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/duckybulbywaterhorn.glb" },
            { label: "obesewarrior", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/obesewarrior.glb" },
            { label: "askflamongostache", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/askflamongostache.glb" },
            { label: "hotdoghorn", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/hotdoghorn.glb" },
            { label: "pumpzhehorn", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/pumpzhehorn.glb" },
            { label: "grasscowschmeckicore", url: "https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/grasscowschmeckicore.glb" }
        ];

        let activeHeadLoaderRelease = null;
        let headLoadVersion = 0;
        function startLoading(label = '3D-KOPF WIRD GELADEN') {
            headLoadVersion += 1;
            if (activeHeadLoaderRelease) activeHeadLoaderRelease();
            activeHeadLoaderRelease = window.LHU?.Loader?.show(label, { delay: 120, minVisible: 320 }) || null;
            return headLoadVersion;
        }
        function stopLoading(version) {
            if (version !== headLoadVersion) return;
            if (activeHeadLoaderRelease) {
                const release = activeHeadLoaderRelease;
                activeHeadLoaderRelease = null;
                release();
            }
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000); camera.position.set(2.6, 0, 2.6);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" }); 
        renderer.setPixelRatio(getDPR()); 
        renderer.setSize(innerWidth, innerHeight); 
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        document.getElementById("container3D").appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(5, 5, 5); scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.2); fill.position.set(-5, 2, 5); scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(-3, 5, -5); scene.add(rim);

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/");
        dracoLoader.setDecoderConfig({ type: "js" }); // Avoid WASM eval paths under restrictive CSP.
        dracoLoader.setWorkerLimit(1);
        const loader = new GLTFLoader(); loader.setDRACOLoader(dracoLoader);

        const hitEnterSlot = document.getElementById("lhu-image-slot");
        const hitEnterScene = new THREE.Scene();
        const hitEnterCamera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

        const hitEnterRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
        hitEnterRenderer.setPixelRatio(getDPR()); 
        hitEnterRenderer.setClearColor(0x000000, 0); 
        hitEnterRenderer.outputColorSpace = THREE.SRGBColorSpace;
        hitEnterSlot.appendChild(hitEnterRenderer.domElement);

        hitEnterScene.add(new THREE.AmbientLight(0xffffff, 3.0)); 
        hitEnterScene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.5));
        const hitKey = new THREE.DirectionalLight(0xffffff, 4.0); hitKey.position.set(3, 5, 6); hitEnterScene.add(hitKey);
        const hitFill = new THREE.DirectionalLight(0xaac8ff, 2.5); hitFill.position.set(-5, 2, 4); hitEnterScene.add(hitFill);
        const hitRim = new THREE.DirectionalLight(0xff8c22, 3.5); hitRim.position.set(0, 3, -5); hitEnterScene.add(hitRim);

        let hitEnterObject = null, hitEnterMixer = null;
        let hitEnterEmissiveMats = [];
        let hitEnterPauseUntil = 0;
        let hitEnterFlashActive = false;

        function triggerHitEnterFlash(color) {
            const flashColor = new THREE.Color(color);
            hitEnterEmissiveMats.forEach(({ mat }) => {
                mat.emissive.copy(flashColor);
                mat.emissiveIntensity = 5.0;
            });
            hitEnterFlashActive = true;
            hitEnterPauseUntil = performance.now() + 2000;
        }

        function restoreHitEnterAppearance() {
            hitEnterEmissiveMats.forEach(({ mat, origCol, origInt }) => {
                mat.emissive.copy(origCol);
                mat.emissiveIntensity = origInt;
            });
            hitEnterFlashActive = false;
        }

        function fitHitEnterModel(model) {
            const box = new THREE.Box3().setFromObject(model); const center = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3()); const maxSize = Math.max(size.x, size.y, size.z, 0.001);
            model.position.sub(center); model.position.y += size.y * 0.02;
            const fovRad = THREE.MathUtils.degToRad(hitEnterCamera.fov); const distance = (maxSize * 0.62) / Math.tan(fovRad / 2);
            hitEnterCamera.position.set(0, maxSize * 0.08, Math.max(distance, 0.35)); hitEnterCamera.lookAt(0, size.y * 0.02, 0); hitEnterCamera.near = Math.max(0.01, maxSize / 100); hitEnterCamera.far = Math.max(10, maxSize * 20); hitEnterCamera.updateProjectionMatrix();
        }

        const releaseHitEnterLoader = window.LHU?.Loader?.show('INTRO-MODELL WIRD GELADEN', { delay: 120, minVisible: 260 }) || (() => {});
        loader.load("https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/glb/hitenter.glb", (g) => {
            releaseHitEnterLoader();
            hitEnterObject = g.scene;
            hitEnterObject.traverse((child) => {
                if (!child.isMesh || !child.material) return;
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat) => { 
                    if ("envMapIntensity" in mat) mat.envMapIntensity = 1.5; 
                    if ("roughness" in mat && mat.roughness > 0.75) mat.roughness = 0.58; 
                    if ("emissive" in mat) {
                        const origCol = mat.emissive.clone();
                        const origInt = mat.emissiveIntensity;
                        mat.emissive.setRGB(0.055, 0.055, 0.055);
                        mat.emissiveIntensity = 0.35;
                        hitEnterEmissiveMats.push({ mat, origCol, origInt });
                    } 
                });
            });
            hitEnterScene.add(hitEnterObject); fitHitEnterModel(hitEnterObject);
            if (g.animations.length) { hitEnterMixer = new THREE.AnimationMixer(hitEnterObject); g.animations.forEach(clip => hitEnterMixer.clipAction(clip).play()); }
        }, undefined, (error) => {
            releaseHitEnterLoader();
            console.warn("[LHU] Intro-Modell konnte nicht geladen werden:", error);
        });

        const hitEnterResizeObserver = new ResizeObserver(() => {
            const rect = hitEnterSlot.getBoundingClientRect(); const w = Math.max(1, Math.floor(rect.width)); const h = Math.max(1, Math.floor(rect.height));
            hitEnterRenderer.setSize(w, h, false); hitEnterCamera.aspect = w / h; hitEnterCamera.updateProjectionMatrix();
        });
        hitEnterResizeObserver.observe(hitEnterSlot);

        let object = null, mixer = null; const clock = new THREE.Clock();

        function disposeObject(obj) {
            if (!obj) return;
            obj.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) { child.material.forEach(m => disposeMaterial(m)); } else { disposeMaterial(child.material); }
                    }
                }
            });
        }
        function disposeMaterial(mat) {
            if (mat.map) mat.map.dispose();
            if (mat.lightMap) mat.lightMap.dispose();
            if (mat.bumpMap) mat.bumpMap.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.specularMap) mat.specularMap.dispose();
            if (mat.envMap) mat.envMap.dispose();
            mat.dispose();
        }

        function loadHead(url) {
            const requestVersion = startLoading('3D-KOPF WIRD GELADEN');
            if (object) { scene.remove(object); disposeObject(object); object = null; } 
            if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); mixer = null; }

            loader.load(
                url, 
                (g) => {
                    if (requestVersion !== headLoadVersion) {
                        disposeObject(g.scene);
                        return;
                    }
                    object = g.scene; 
                    scene.add(object); 
                    object.userData.emissiveMats = [];
                    object.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                if (m.emissive) {
                                    m.userData.origE = m.emissive.clone();
                                    m.userData.origI = m.emissiveIntensity !== undefined ? m.emissiveIntensity : 1;
                                    object.userData.emissiveMats.push(m);
                                }
                            });
                        }
                    });
                    if (g.animations.length) { 
                        mixer = new THREE.AnimationMixer(object); 
                        g.animations.forEach(clip => mixer.clipAction(clip).play()); 
                    } 
                    stopLoading(requestVersion); 
                },
                undefined,
                (error) => {
                    console.error("Fehler beim Laden von " + url + ":", error);
                    stopLoading(requestVersion);
                    if (requestVersion !== headLoadVersion) return;
                    const container = document.getElementById("container3D");
                    const errDiv = document.createElement("div");
                    errDiv.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff4d4d;font-family:'Press Start 2P',monospace;text-align:center;background:rgba(0,0,0,0.8);padding:20px;border-radius:10px;";
                    errDiv.innerHTML = "FEHLER BEIM LADEN DES 3D-MODELLS.<br><br>BITTE NETZWERK PRÜFEN.";
                    container.appendChild(errDiv);
                    setTimeout(() => errDiv.remove(), 4000);
                }
            );
        }

        const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;

        let musicOn = false; const music = document.getElementById("background-music");
        document.getElementById("music-toggle").onclick = () => { 
            musicOn = !musicOn; 
            musicOn ? music.play().catch(()=>{}) : music.pause(); 
            document.getElementById("music-toggle").textContent = musicOn ? t.stopMusic : t.playMusic; 
        };
        document.getElementById("navigate-to-main").onclick = () => { window.__lhuEnterMainSite?.(); };

        let gagActive = false, gagStart = 0, gagBase = null, gagSize = new THREE.Vector3(), camTween = null;
        let rainbowActive = false, rainbowStart = 0, rainbowBaseRot = null, rainbowBasePos = null, rainbowBaseScale = null; 
        let rainbowMatStates = [];

        let wisdomActive = false; 
        let typewriterInterval = null;
        let wisdomFallbackTimeout = null;
        let musicPlayTime = 0, musicPhase = 0;
        let wasInPhase7 = false;

        function tweenCamera(toPos, toTarget, dur, onDone) {
            camTween = { fromPos: camera.position.clone(), toPos: toPos.clone(), fromTarget: controls.target.clone(), toTarget: toTarget.clone(), start: performance.now(), dur, onDone }; controls.enabled = false; controls.autoRotate = false;
        }

        function interruptWisdom() {
            if (!wisdomActive) return;
            wisdomActive = false;
            isTyping = false;
            if (typewriterInterval) clearInterval(typewriterInterval);
            if (wisdomFallbackTimeout) clearTimeout(wisdomFallbackTimeout);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            
            const textEl = document.getElementById("wisdom-display");
            textEl.classList.remove("wisdom-active");
            textEl.textContent = "";
            document.getElementById("matrix-bg").style.opacity = "1";
        }

        document.getElementById("heart-btn").onclick = () => {
            interruptWisdom();
            if (!object || gagActive || rainbowActive) return; 
            
            music.pause(); musicOn = false; document.getElementById("music-toggle").textContent = t.playMusic;
            gagActive = true; gagStart = performance.now(); gagBase = object.position.clone();
            document.getElementById("matrix-bg").style.opacity = "0";
            const box = new THREE.Box3().setFromObject(object); box.getSize(gagSize); const center = new THREE.Vector3(); box.getCenter(center);
            const eye = new THREE.Vector3(center.x, box.max.y - gagSize.y * 0.12, center.z + gagSize.z * 0.1);
            const closePos = eye.clone().add(new THREE.Vector3(gagSize.x * 0.25, gagSize.y * 0.02, gagSize.z * 0.55 + gagSize.length() * 0.35));
            tweenCamera(closePos, eye, 650);
            document.getElementById("heart-emojis").classList.add("active");
            const sndWolf = document.getElementById("snd-wolf"); const sndRizz = document.getElementById("snd-rizz"); sndWolf.currentTime = 0; sndWolf.play().catch(()=>{}); sndWolf.onended = () => { sndRizz.currentTime = 0; sndRizz.play().catch(endGag); sndRizz.onended = endGag; }; setTimeout(endGag, 9000);
        };

        function endGag() {
            if (gagBase) object.position.copy(gagBase); object.rotation.set(0,0,0); gagActive = false; document.getElementById("heart-emojis").classList.remove("active"); document.getElementById("matrix-bg").style.opacity = "1"; tweenCamera(new THREE.Vector3(2.6, 0, 2.6), new THREE.Vector3(0, 0, 0), 700, () => controls.autoRotate = true);
        }

        document.getElementById("rainbow-btn").onclick = () => {
            interruptWisdom();
            if (!object || gagActive || rainbowActive) return; 
            
            music.pause(); musicOn = false; document.getElementById("music-toggle").textContent = t.playMusic;
            rainbowActive = true; rainbowStart = performance.now(); 
            rainbowBaseRot = object.rotation.clone(); rainbowBasePos = object.position.clone(); rainbowBaseScale = object.scale.clone();
            document.getElementById("matrix-bg").style.opacity = "0";
            rainbowMatStates = []; 
            if(object.userData.emissiveMats) {
                object.userData.emissiveMats.forEach(m => { rainbowMatStates.push({ mat: m, col: m.emissive.clone(), int: m.emissiveIntensity }); });
            }
            document.getElementById("rainbow-aura").classList.add("active"); document.getElementById("rainbow-emojis").classList.add("active");
            const box = new THREE.Box3().setFromObject(object); box.getSize(gagSize); const center = new THREE.Vector3(); box.getCenter(center); const maxDim = Math.max(gagSize.x, gagSize.y, gagSize.z); tweenCamera(new THREE.Vector3(0, center.y, maxDim * 2.3), center, 450);
            const snd = document.getElementById("snd-rainbow"); snd.currentTime = 0; snd.play().catch(()=>{}); controls.enabled = false; controls.autoRotate = false;
        };

        function endRainbow() {
            rainbowActive = false; if (rainbowBaseRot) object.rotation.copy(rainbowBaseRot); if (rainbowBasePos) object.position.copy(rainbowBasePos); if (rainbowBaseScale) object.scale.copy(rainbowBaseScale); rainbowBasePos = null; 
            rainbowMatStates.forEach(s => { s.mat.emissive.copy(s.col); if (s.int !== undefined) s.mat.emissiveIntensity = s.int; }); 
            document.getElementById("rainbow-aura").classList.remove("active"); document.getElementById("rainbow-emojis").classList.remove("active"); document.getElementById("shmup-container").style.display = "none"; document.getElementById("matrix-bg").style.opacity = "1"; 
            const centerPoint = document.querySelector(".shmup-center"); if(centerPoint) { centerPoint.style.left = "50%"; centerPoint.style.top = "50%"; }
            controls.enabled = true; controls.autoRotate = true; tweenCamera(new THREE.Vector3(2.6, 0, 2.6), new THREE.Vector3(0, 0, 0), 700, () => controls.autoRotate = true);
        }

        wisdomBtn.onclick = () => {
            if (!object || gagActive || rainbowActive) return;

            if (wisdomFallbackTimeout) clearTimeout(wisdomFallbackTimeout);
            if (typewriterInterval) clearInterval(typewriterInterval);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isTyping = false;

            music.pause(); musicOn = false; document.getElementById("music-toggle").textContent = t.playMusic;
            wisdomActive = true;
            document.getElementById("matrix-bg").style.opacity = "0.2";

            tweenCamera(new THREE.Vector3(2.6, 0, 2.6), new THREE.Vector3(0, 0, 0), 400, () => {
                controls.autoRotate = false; object.rotation.set(0,0,0);
            });

            const targetLang = isGerman ? 'de' : 'en';
            const activeWisdom = isGerman ? dailyWisdom.de : dailyWisdom.en;

            if (currentWisdomLang !== targetLang) {
                currentWisdomLang = targetLang;
                availableWisdomIndices = activeWisdom.map((_, index) => index);
            }

            if (availableWisdomIndices.length === 0) {
                availableWisdomIndices = activeWisdom.map((_, index) => index);
                wisdomCounterEl.style.background = "#fff";
                setTimeout(() => wisdomCounterEl.style.background = "#00FF28", 300);
            }

            const randomIndexWithinAvailable = Math.floor(Math.random() * availableWisdomIndices.length);
            const selectedQuoteIndex = availableWisdomIndices[randomIndexWithinAvailable];
            availableWisdomIndices.splice(randomIndexWithinAvailable, 1);
            
            updateWisdomCounter(true);

            const phrase = activeWisdom[selectedQuoteIndex];
            const textEl = document.getElementById("wisdom-display");

            textEl.textContent = ""; 
            textEl.classList.add("wisdom-active");

            let charIndex = 0; 
            const typingSpeed = 15; 
            const totalTypeTime = phrase.length * typingSpeed;

            isTyping = true; 

            typewriterInterval = setInterval(() => {
                textEl.textContent += phrase.charAt(charIndex);
                charIndex++;
                if(charIndex >= phrase.length) { clearInterval(typewriterInterval); isTyping = false; }
            }, typingSpeed);

            const cleanupWisdom = () => {
                wisdomActive = false; isTyping = false; textEl.classList.remove("wisdom-active"); textEl.textContent = "";
                document.getElementById("matrix-bg").style.opacity = "1"; controls.autoRotate = true;
            };

            if ('speechSynthesis' in window) {
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance(phrase);
                window._lhuUtterance = utterance; 
                utterance.lang = isGerman ? 'de-DE' : 'en-US'; 
                const headIdx = document.getElementById("head-select").selectedIndex;
                const profiles = [ { p: 0.1, r: 1.35 }, { p: 1.8, r: 1.45 }, { p: 0.4, r: 1.25 }, { p: 0.8, r: 1.35 }, { p: 1.5, r: 1.40 }, { p: 1.2, r: 1.30 }, { p: 0.9, r: 1.35 } ];
                const prof = profiles[headIdx % profiles.length];
                utterance.pitch = prof.p;
                utterance.rate = prof.r;
                const voices = synth.getVoices();
                const langVoices = voices.filter(v => v.lang.startsWith(isGerman ? "de" : "en"));
                if (langVoices.length > 0) { utterance.voice = langVoices[headIdx % langVoices.length]; }
                utterance.onend = () => { isTyping = false; }; 
                synth.speak(utterance);
            }

            const speechEstTime = phrase.length * 80;
            wisdomFallbackTimeout = setTimeout(cleanupWisdom, Math.max(totalTypeTime + 3000, speechEstTime + 2000));
        };

        function spawnEmojis(containerId, char, count, sizeBase, sizeVar) {
            const container = document.getElementById(containerId);
            for (let i = 0; i < count; i++) {
                const e = document.createElement("span"); 
                e.className = "fast-rise-emoji"; e.textContent = char; 
                e.style.setProperty("--left", `${Math.random() * 100}%`); 
                e.style.setProperty("--size", `${sizeBase + Math.random() * sizeVar}px`); 
                e.style.setProperty("--dur", `${0.15 + Math.random() * 0.25}s`); 
                e.style.setProperty("--delay", `${-Math.random() * 2}s`); 
                e.style.setProperty("--drift", `${(Math.random() - 0.5) * 60}px`); 
                container.appendChild(e);
            }
        }
        spawnEmojis("heart-emojis", "❤️", 30, 60, 40); spawnEmojis("rainbow-emojis", "🌈", 40, 30, 20);

        const selectEl = document.getElementById("head-select");
        MODELS.forEach(m => { const opt = document.createElement("option"); opt.value = m.url; opt.textContent = m.label; selectEl.appendChild(opt); });
        selectEl.addEventListener("change", (e) => { loadHead(e.target.value); }); 
        loadHead(MODELS[0].url);

        (() => {
            const intro = document.getElementById("lhu-intro");
            const audio = document.getElementById("lhu-intro-audio");
            const canvas = document.getElementById("lhu-intro-canvas");

            const btnSkipHeads = document.getElementById("btn-skip-heads");
            const btnSkipMain = document.getElementById("btn-skip-main");

            if(btnSkipHeads) btnSkipHeads.addEventListener("click", () => {
                window.__lhuStopIntro?.(true);
            });
            if(btnSkipMain) btnSkipMain.addEventListener("click", () => {
                window.__lhuStopIntro?.(true);
                window.__lhuEnterMainSite?.();
            });

            const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
            const word = document.getElementById("lhu-intro-word");
            
            let W = 0, H = 0, introStart = 0; let introVariant = "yellow"; 
            let introAnimId = null;

            const variantColors = {
                red: { color: "#ff3333", bg: "linear-gradient(180deg, #ff9999 0%, #ff3333 24%, #cc0000 48%, #ff6666 68%, #ff3333 100%)", shadow: "rgba(255,50,50,.75)", hue: 0.0 },
                yellow: { color: "#ffd400", bg: "linear-gradient(180deg, #fff6a0 0%, #ffd400 24%, #ff9d00 48%, #fff04a 68%, #ffd400 100%)", shadow: "rgba(255,212,0,.75)", hue: 45.0 },
                blue: { color: "#33bbff", bg: "linear-gradient(180deg, #99ddff 0%, #33bbff 24%, #0077cc 48%, #66ccff 68%, #33bbff 100%)", shadow: "rgba(50,180,255,.75)", hue: 210.0 }
            };

            const vsSource = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
            const fsSource = `
                precision mediump float;
                uniform vec2 r; uniform float t; uniform float h;
                vec3 hsv2rgb(vec3 c) { vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return c.z * mix(vec3(1.), rgb, c.y); }
                float hash11(float p) { p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
                float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
                mat2 rot(float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
                float noise(vec2 p) { vec2 i=floor(p), f=fract(p); float a=hash12(i), b=hash12(i+vec2(1.,0.)), c=hash12(i+vec2(0.,1.)), d=hash12(i+vec2(1.,1.)); vec2 u = smoothstep(0.0, 1.0, f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
                float fbm(vec2 p) { float v=0., a=0.5; for(int i=0;i<5;++i){ v+=a*noise(p); p*=rot(0.45)*2.; a*=0.5; } return v; }
                void main() {
                    vec2 uv = gl_FragCoord.xy / r.xy; uv = 2.0 * uv - 1.0; uv.x *= r.x / r.y;
                    uv += 2.0 * fbm(uv * 1.0 + 0.8 * t * 1.5) - 1.0;
                    float dist = abs(uv.x);
                    vec3 col = hsv2rgb(vec3(h/360.0, 0.9, 1.0)) * pow(mix(0.0, 0.15, hash11(t * 1.5)) / dist, 1.0);
                    gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
                }
            `;

            let rLoc, tLoc, hLoc;
            if (gl) {
                const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, vsSource); gl.compileShader(vs);
                const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fsSource); gl.compileShader(fs);
                const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
                const aLoc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
                rLoc = gl.getUniformLocation(prog, "r"); tLoc = gl.getUniformLocation(prog, "t"); hLoc = gl.getUniformLocation(prog, "h");
            }

            function resizeIntro() { W = innerWidth; H = innerHeight; canvas.width = W; canvas.height = H; if(gl) gl.viewport(0, 0, W, H); }

            let introCleanedUp = false;
            function cleanupIntro(stopAudio = false) {
                if (introCleanedUp) {
                    if (stopAudio && audio) { audio.pause(); audio.currentTime = 0; }
                    return;
                }
                introCleanedUp = true;
                if (introAnimId !== null) cancelAnimationFrame(introAnimId);
                introAnimId = null;
                window.removeEventListener("resize", resizeIntro);

                // The visual intro may end while the selected music sample is still playing.
                if (stopAudio && audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                if (intro && intro.isConnected) intro.remove();
                if (gl) {
                    const loseContext = gl.getExtension("WEBGL_lose_context");
                    if (loseContext) loseContext.loseContext();
                }
            }
            window.__lhuStopIntro = (stopAudio = true) => cleanupIntro(stopAudio);

            function easeOutElastic(x) {
                const c4 = (2 * Math.PI) / 3;
                return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
            }

            let currentSpans = [];
            function buildWordSpans(wordStr) {
                word.innerHTML = ""; 
                currentSpans = [];
                const stack = document.createElement("div");
                stack.style.display = "flex"; stack.style.flexDirection = "column"; stack.style.alignItems = "center"; 
                stack.style.fontFamily = "Impact, sans-serif"; stack.style.fontSize = "clamp(42px, 9vh, 100px)";
                stack.style.transformStyle = "preserve-3d";
                stack.style.perspective = "1000px";

                for (let i = 0; i < wordStr.length; i++) {
                    const ch = wordStr[i];
                    const letter = document.createElement("span"); 
                    letter.textContent = ch; 
                    letter.style.display = "inline-block"; letter.style.lineHeight = "0.9"; 
                    letter.style.color = variantColors[introVariant].color; letter.style.fontWeight = "900"; 
                    letter.style.backgroundImage = variantColors[introVariant].bg; letter.style.webkitBackgroundClip = "text"; 
                    letter.style.backgroundClip = "text"; letter.style.webkitTextFillColor = "transparent"; 
                    letter.style.transition = "none";
                    
                    letter.dataset.seed = Math.random();
                    letter.dataset.offset = (Math.random() - 0.5);
                    
                    stack.appendChild(letter);
                    currentSpans.push(letter);
                }
                word.appendChild(stack);
            }

            function animateIntro(now) {
                if (!document.body.contains(intro)) return;
                const timeOffset = (now - introStart) / 1000;
                
                if(gl) {
                    gl.uniform2f(rLoc, W, H);
                    gl.uniform1f(tLoc, timeOffset);
                    gl.uniform1f(hLoc, variantColors[introVariant].hue);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                }

                const seqT = timeOffset - 0.1; 
                if (seqT >= 0 && seqT < 3.3) {
                    const index = Math.min(2, Math.floor(seqT / 1.1)); 
                    const local = seqT - index * 1.1; 
                    const currentWordStr = ["LIGHTNING", "HORN", "UNICORN"][index];

                    if (word.dataset.currentWord !== currentWordStr) {
                        word.dataset.currentWord = currentWordStr;
                        buildWordSpans(currentWordStr);
                    }
                    word.style.opacity = "1";

                    const p = Math.min(1, Math.max(0, local * 1.2)); 
                    const pText = Math.min(1, p * 1.5);

                    currentSpans.forEach((letter, i) => {
                        const seed = parseFloat(letter.dataset.seed);
                        const offset = parseFloat(letter.dataset.offset);

                        if (introVariant === "red") {
                            const delay = i * 0.05;
                            const pLocal = Math.max(0, Math.min(1, (pText - delay) * 2));
                            
                            if (pLocal < 1) {
                                const glitchX = Math.sin(now * 0.05 + i) * 30 * (1 - pLocal);
                                const glitchY = Math.cos(now * 0.07 + i) * 15 * (1 - pLocal);
                                
                                letter.style.transform = `translate3d(${glitchX}px, ${glitchY}px, 0) scaleY(${1.5 - pLocal * 0.5})`;
                                letter.style.textShadow = `${-20 * (1 - pLocal)}px 0 0 rgba(0,255,255,0.8), ${20 * (1 - pLocal)}px 0 0 rgba(255,0,100,0.8)`;
                                letter.style.opacity = pLocal;
                            } else {
                                const isGlitching = Math.random() < 0.05;
                                const gx = isGlitching ? (Math.random() - 0.5) * 20 : 0;
                                const gy = isGlitching ? (Math.random() - 0.5) * 10 : 0;
                                letter.style.transform = `translate3d(${gx}px, ${gy}px, 0) scaleY(1)`;
                                letter.style.textShadow = isGlitching ? `-5px 0 0 rgba(0,255,255,0.8), 5px 0 0 rgba(255,0,100,0.8)` : `0 0 10px rgba(255,50,50,0.5)`;
                                letter.style.opacity = 1;
                            }
                        } 
                        else if (introVariant === "yellow") {
                            const delay = i * 0.06;
                            const pLocal = Math.max(0, Math.min(1, (pText - delay) * 3));
                            
                            const startY = 80;
                            const startZ = -200;
                            const currentY = startY * (1 - pLocal);
                            const currentZ = startZ * (1 - pLocal);
                            const blur = 20 * (1 - pLocal);
                            const rotateX = 45 * (1 - pLocal);
                            
                            const wave = pLocal >= 1 ? Math.sin(now * 0.002 + i * 0.5) * 10 : 0;
                            const rotZ = pLocal >= 1 ? Math.sin(now * 0.001 + i) * 2 : 0;

                            letter.style.transform = `translate3d(0, ${currentY + wave}px, ${currentZ}px) rotateX(${rotateX}deg) rotateZ(${rotZ}deg)`;
                            letter.style.filter = `blur(${blur}px)`;
                            letter.style.opacity = pLocal;
                            letter.style.textShadow = `0 0 ${20 + Math.sin(now*0.005 + i)*10}px ${variantColors.yellow.shadow}`;
                        } 
                        else if (introVariant === "blue") {
                            const delay = i * 0.04;
                            const pLocal = Math.max(0, Math.min(1, (pText - delay) * 2));
                            
                            if (pLocal < 1) {
                                const elasticY = -400 * (1 - easeOutElastic(pLocal));
                                const squash = 1 + Math.sin(pLocal * Math.PI) * 0.5;
                                const stretch = 1 - Math.sin(pLocal * Math.PI) * 0.3;
                                
                                letter.style.transform = `translate3d(0, ${elasticY}px, 0) scale(${stretch}, ${squash})`;
                                letter.style.opacity = Math.min(1, pLocal * 3);
                            } else {
                                const wobble = Math.sin(now * 0.003 + i * 0.8) * 8;
                                const skewX = Math.sin(now * 0.002 + i * 1.2) * 5;
                                
                                letter.style.transform = `translate3d(${wobble}px, 0, 0) skewX(${skewX}deg) scale(1, 1)`;
                                letter.style.opacity = 1;
                                letter.style.textShadow = `0 0 15px ${variantColors.blue.shadow}`;
                            }
                        }
                    });
                } else { 
                    word.style.opacity = "0"; 
                    word.dataset.currentWord = "";
                }

                if (timeOffset >= 3.5) {
                    // End the animation only; do not cut off the selected sample.
                    cleanupIntro(false);
                    return;
                }
            introAnimId = requestAnimationFrame(animateIntro);
            }

            resizeIntro(); window.addEventListener("resize", resizeIntro);

            const introButtons = Array.from(document.querySelectorAll(".lhu-pill"));
            const introHint = document.getElementById("lhu-intro-hint");
            const introColors = {
                red: 0xff3333,
                yellow: 0xffd400,
                blue: 0x33bbff
            };
            let armedVariant = null;
            let introLaunched = false;

            introButtons.forEach(btn => {
                btn.setAttribute("aria-label", `${btn.dataset.intro} intro`);
                btn.setAttribute("aria-pressed", "false");

                btn.addEventListener("click", () => {
                    if (introLaunched) return;

                    const chosenVariant = btn.dataset.intro;

                    // First press arms this color and triggers the two-second Enter flash/pause.
                    if (armedVariant !== chosenVariant) {
                        armedVariant = chosenVariant;
                        introVariant = chosenVariant;

                        introButtons.forEach(other => {
                            const isSelected = other === btn;
                            other.classList.toggle("is-armed", isSelected);
                            other.setAttribute("aria-pressed", String(isSelected));
                        });

                        triggerHitEnterFlash(introColors[chosenVariant]);

                        if (introHint) {
                            introHint.textContent = isGerman
                                ? `NOCHMAL DRÜCKEN: ${chosenVariant.toUpperCase()}`
                                : `PRESS AGAIN: ${chosenVariant.toUpperCase()}`;
                        }
                        return;
                    }

                    // Second press on the same color launches the matching intro.
                    introLaunched = true;
                    introButtons.forEach(button => { button.disabled = true; });
                    introVariant = chosenVariant;

                    if (introHint) introHint.textContent = "";
                    document.getElementById("lhu-enter-panel").classList.add("hidden");

                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.src = `lhu${introVariant}.mp3`;
                        audio.load();
                    }

                    setTimeout(() => {
                        if (audio) audio.play().catch((error) => {
                            console.warn('[LHU] Intro-Sample konnte nicht gestartet werden:', error);
                        });
                        introStart = performance.now();
                        if (introAnimId !== null) cancelAnimationFrame(introAnimId);
                        introAnimId = requestAnimationFrame(animateIntro);
                    }, 320);
                });
            });
        })();

        let isTabVisible = !document.hidden;
        let indexExperienceActive = true;
        let indexAnimationFrame = null;

        document.addEventListener("visibilitychange", () => {
            isTabVisible = !document.hidden;
            if (isTabVisible) {
                clock.getDelta();
                if (indexExperienceActive && indexAnimationFrame === null) {
                    indexAnimationFrame = requestAnimationFrame(animate);
                }
                if (musicOn && music.paused) music.play().catch(()=>{});
            } else {
                if (indexAnimationFrame !== null) cancelAnimationFrame(indexAnimationFrame);
                indexAnimationFrame = null;
                if (musicOn) music.pause();
            }
        });

        function animate() {
            indexAnimationFrame = null;
            if (!isTabVisible || !indexExperienceActive) return;
            indexAnimationFrame = requestAnimationFrame(animate);

            const delta = clock.getDelta();
            if (mixer) mixer.update(delta);

            if (camTween) {
                const k = Math.min(1, (performance.now() - camTween.start) / camTween.dur);
                const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e); 
                controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e); 
                camera.lookAt(controls.target);
                if (k >= 1) { if(camTween.onDone) camTween.onDone(); camTween = null; controls.enabled = true; }
            } else controls.update();

            if (object) {
                if (gagActive) {
                    const tt = (performance.now() - gagStart) / 1000; const amp = gagSize.length() * 0.04;
                    object.position.x = gagBase.x + Math.sin(tt * 5) * amp; 
                    object.position.z = gagBase.z + (Math.sin(tt * 10) * 0.5 + 0.5) * amp * 0.6; 
                    object.position.y = gagBase.y + Math.sin(tt * 5 + Math.PI / 2) * amp * 0.4;
                    object.rotation.z = Math.sin(tt * 5) * 0.08; 
                    object.rotation.y = Math.sin(tt * 3) * 0.12;
                } 
                else if (rainbowActive) {
                    const tt = (performance.now() - rainbowStart) / 1000;
                    if (tt < 0.35) {
                        const u = tt / 0.35; object.position.y = rainbowBasePos.y + Math.pow(u, 3) * 20; 
                    } else if (tt < 0.45) {
                        object.scale.setScalar(0.75); object.position.y = rainbowBasePos.y - 14; object.position.z = rainbowBasePos.z - 15; 
                    } else if (tt < 2.45) {
                        const u = (tt - 0.45) / 2.0; object.position.y = (rainbowBasePos.y - 14) + (u * 28); object.position.z = rainbowBasePos.z - 15;
                        object.rotation.y = rainbowBaseRot.y + (u * Math.PI * 2 * 3); object.rotation.x = rainbowBaseRot.x + 0.4; 
                        const pulse = 0.7 + 0.3 * Math.sin(tt * 28); const hue = (tt * 260) % 360;
                        if(object.userData.emissiveMats) {
                            object.userData.emissiveMats.forEach(m => {
                                m.emissive.setHSL(hue / 360, 1, 0.52); 
                                if(m.emissiveIntensity !== undefined) m.emissiveIntensity = 0.35 + pulse * 3.0;
                            });
                        }
                        const screenPos = object.position.clone().project(camera); const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth; const screenY = -(screenPos.y * 0.5 - 0.5) * window.innerHeight;
                        const crossfire = document.getElementById("shmup-container"); const centerPoint = crossfire.querySelector(".shmup-center");
                        if (centerPoint) { centerPoint.style.left = screenX + "px"; centerPoint.style.top = screenY + "px"; }
                        if (tt >= 0.7 && tt < 2.2) { crossfire.style.display = "block"; } else { crossfire.style.display = "none"; }
                    }
                    if (tt >= 2.45) endRainbow();
                } 
                else if (wisdomActive) {
                    let targetRotX = 0;
                    if (isTyping) {
                        const headIdx = document.getElementById("head-select").selectedIndex;
                        const rates = [0.85, 1.15, 0.70, 1.05, 1.10, 0.95, 1.00]; 
                        const currentRate = rates[headIdx % rates.length];
                        targetRotX = Math.sin(performance.now() * 0.04 * currentRate) * 0.25; 
                    }
                    object.rotation.x += (targetRotX - object.rotation.x) * (delta * 12); 
                    object.rotation.y += (0 - object.rotation.y) * (delta * 8); 
                    object.rotation.z += (0 - object.rotation.z) * (delta * 8); 
                }
                else if (musicOn) { 
                    musicPlayTime += delta; 
                    const loopTime = musicPlayTime % 70; 
                    const baseFreq = Math.PI / (60 / 138 * 0.5); 

                    let targetRotX = 0, targetRotY = 0, targetRotZ = 0;
                    let phase4Active = false, phase6Active = false, phase7Active = false;

                    if (loopTime < 30 || loopTime >= 40) { window.isTrafficConePhase = false; }

                    if (loopTime < 10) { musicPhase += baseFreq * delta; targetRotX = Math.sin(musicPhase) * 0.08; } 
                    else if (loopTime < 20) { musicPhase += baseFreq * 2.0 * delta; targetRotX = Math.sin(musicPhase) * 0.14; } 
                    else if (loopTime < 30) { musicPhase += baseFreq * 0.4 * delta; targetRotX = Math.sin(musicPhase * 2) * 0.06 - 0.04; targetRotY = Math.sin(musicPhase) * 0.45; targetRotZ = Math.cos(musicPhase) * 0.22; } 
                    else if (loopTime < 40) {
                        phase4Active = true; window.isTrafficConePhase = true;
                        targetRotX = Math.sin(loopTime * 40) * 0.08; targetRotY = Math.sin(loopTime * 47) * 0.08; targetRotZ = 0;
                    } 
                    else if (loopTime < 50) { musicPhase += baseFreq * 1.5 * delta; targetRotY = Math.sin(musicPhase) * 0.35; targetRotZ = Math.sin(musicPhase * 2) * 0.05; } 
                    else if (loopTime < 60) { phase6Active = true; musicPhase += baseFreq * delta; targetRotX = Math.sin(musicPhase) * 0.08; } 
                    else { phase7Active = true; }

                    if (phase7Active) {
                        object.rotation.x += delta * 15; object.rotation.y += (0 - object.rotation.y) * (delta * 8); object.rotation.z += (0 - object.rotation.z) * (delta * 8);
                        object.position.x += (0 - object.position.x) * (delta * 8); object.position.y += (Math.abs(Math.sin(loopTime * 15)) * 0.3 - object.position.y) * (delta * 8);
                        wasInPhase7 = true;
                    } else {
                        if (wasInPhase7) { object.rotation.x = object.rotation.x % (Math.PI * 2); wasInPhase7 = false; }
                        object.rotation.x += (targetRotX - object.rotation.x) * (delta * 8); object.rotation.y += (targetRotY - object.rotation.y) * (delta * 8); object.rotation.z += (targetRotZ - object.rotation.z) * (delta * 8);
                        object.position.x += (0 - object.position.x) * (delta * 8); object.position.y += (0 - object.position.y) * (delta * 8);
                    }

                    if (phase4Active) {
                        const blink = Math.floor(loopTime * 4) % 2 === 0; let targetColor = new THREE.Color(blink ? 0xff6600 : 0x111111);
                        if(object.userData.emissiveMats) { object.userData.emissiveMats.forEach(m => { m.emissive.copy(targetColor); if(m.emissiveIntensity !== undefined) m.emissiveIntensity = blink ? 3.5 : 0.5; }); }
                    } else if (phase6Active) {
                        const cycle = (loopTime % 1.5) / 1.5; let targetColor = new THREE.Color();
                        if (cycle < 0.33) targetColor.setHex(0xff3333); else if (cycle < 0.66) targetColor.setHex(0xffd400); else targetColor.setHex(0x33bbff); 
                        if(object.userData.emissiveMats) { object.userData.emissiveMats.forEach(m => { m.emissive.lerp(targetColor, delta * 12); if(m.emissiveIntensity !== undefined) m.emissiveIntensity = 2.5; }); }
                    } else {
                        if(object.userData.emissiveMats) { object.userData.emissiveMats.forEach(m => { m.emissive.lerp(m.userData.origE, delta * 5); if (m.emissiveIntensity !== undefined) { let targetI = m.userData.origI !== undefined ? m.userData.origI : 1; m.emissiveIntensity += (targetI - m.emissiveIntensity) * (delta * 5); } }); }
                    }
                } else { 
                    window.isTrafficConePhase = false;
                    if (wasInPhase7) { object.rotation.x = object.rotation.x % (Math.PI * 2); wasInPhase7 = false; }
                    object.rotation.x += (0 - object.rotation.x) * (delta * 8); object.rotation.y += (0 - object.rotation.y) * (delta * 8); object.rotation.z += (0 - object.rotation.z) * (delta * 8); 
                    object.position.x += (0 - object.position.x) * (delta * 8); object.position.y += (0 - object.position.y) * (delta * 8);
                    if(object.userData.emissiveMats) { object.userData.emissiveMats.forEach(m => { m.emissive.lerp(m.userData.origE, delta * 5); if (m.emissiveIntensity !== undefined) { let targetI = m.userData.origI !== undefined ? m.userData.origI : 1; m.emissiveIntensity += (targetI - m.emissiveIntensity) * (delta * 5); } }); }
                }
            }
            renderer.render(scene, camera);
            const hitEnterNow = performance.now();
            const hitEnterPaused = hitEnterFlashActive && hitEnterNow < hitEnterPauseUntil;

            if (hitEnterFlashActive && !hitEnterPaused) {
                restoreHitEnterAppearance();
            }
            if (!hitEnterPaused) {
                if (hitEnterMixer) hitEnterMixer.update(delta);
                if (hitEnterObject) hitEnterObject.rotation.y += delta * 0.75;
            }
            hitEnterRenderer.render(hitEnterScene, hitEnterCamera);
        }
        window.__lhuPauseIndexExperience = function() {
            if (!indexExperienceActive) return;
            indexExperienceActive = false;

            if (indexAnimationFrame !== null) cancelAnimationFrame(indexAnimationFrame);
            indexAnimationFrame = null;

            if (musicOn) {
                music.pause();
                musicOn = false;
                document.getElementById("music-toggle").textContent = t.playMusic;
            }
            window.isTrafficConePhase = false;

            // This landing scene is not used after entering the main site.
            // Stop controls/observers and release both WebGL renderers.
            if (controls && typeof controls.dispose === 'function') controls.dispose();
            if (mixer) {
                mixer.stopAllAction();
                mixer.uncacheRoot(mixer.getRoot());
                mixer = null;
            }
            if (object) {
                scene.remove(object);
                disposeObject(object);
                object = null;
            }

            if (hitEnterMixer) {
                hitEnterMixer.stopAllAction();
                hitEnterMixer.uncacheRoot(hitEnterMixer.getRoot());
                hitEnterMixer = null;
            }
            if (hitEnterObject) {
                hitEnterScene.remove(hitEnterObject);
                disposeObject(hitEnterObject);
                hitEnterObject = null;
            }
            if (hitEnterResizeObserver) hitEnterResizeObserver.disconnect();
            if (dracoLoader && typeof dracoLoader.dispose === 'function') dracoLoader.dispose();

            try { renderer.dispose(); renderer.forceContextLoss(); } catch (error) {
                console.warn('[LHU] Main renderer cleanup:', error);
            }
            try { hitEnterRenderer.dispose(); hitEnterRenderer.forceContextLoss(); } catch (error) {
                console.warn('[LHU] Intro renderer cleanup:', error);
            }
        };
        indexAnimationFrame = isTabVisible ? requestAnimationFrame(animate) : null;

        let resizeTimeout;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = innerWidth / innerHeight; 
                camera.updateProjectionMatrix(); 
                renderer.setPixelRatio(getDPR());
                renderer.setSize(innerWidth, innerHeight); 
            }, 150);
        });
    