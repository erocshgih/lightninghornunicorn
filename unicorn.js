import * as THREE from 'https://esm.sh/three@0.129.0';
import { OrbitControls } from 'https://esm.sh/three@0.129.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.129.0/examples/jsm/environments/RoomEnvironment.js';

// Language selection
const userLang = navigator.language.startsWith('de')
  ? 'de'
  : navigator.language.startsWith('fr')
  ? 'fr'
  : 'en';
document.body.setAttribute('data-current-lang', userLang);
for (const el of document.querySelectorAll('[data-lang-' + userLang + ']')) {
  el.textContent = el.getAttribute(`data-lang-${userLang}`);
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2.6, 0.0, 2.6);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById('container3D').appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(2, 2, 3);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x4040ff, 0.6));

// Model
const loader = new GLTFLoader();
let object;
loader.load('https://raw.githubusercontent.com/erocshgih/lightninghornunicorn/main/friendlyunicornminator.glb', (gltf) => {
  object = gltf.scene;
  object.position.set(0, -0.05, 0);
  scene.add(object);
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Music logic
const music = document.getElementById('background-music');
let isPlaying = false;
const bpm = 128, nodSpeed = (60 / bpm) * 0.5;

document.getElementById('music-toggle').addEventListener('click', () => {
  isPlaying = !isPlaying;
  isPlaying ? music.play() : music.pause();

  const lang = document.body.getAttribute('data-current-lang');
  const base = document.getElementById('music-toggle')
    .getAttribute(`data-lang-${lang}`)
    .split(' - ')[0];
  const onTxt = { en: 'MUSIC ON', de: 'MUSIK EIN', fr: 'MUSIQUE ACTIVÉE' };
  const offTxt = { en: 'MUSIC OFF', de: 'MUSIK AUS', fr: 'MUSIQUE ÉTEINTE' };
  document.getElementById('music-toggle').textContent = `${base} - ${isPlaying ? onTxt[lang] : offTxt[lang]}`;
});

document.getElementById('navigate-to-main').addEventListener('click', () => {
  window.location.href = 'https://erocshgih.github.io/lightninghornunicorn/LightningHornUnicorn.html';
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (object) {
    object.rotation.y += 0.0003;
    if (isPlaying) {
      const t = Date.now() * 0.001;
      object.rotation.x = Math.sin(t * (Math.PI / nodSpeed)) * 0.1;
    } else {
      object.rotation.x *= 0.9;
    }
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
