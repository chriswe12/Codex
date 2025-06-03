const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

// Ground
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Track - closed loop
const outerRX = 80;
const outerRZ = 40;
const trackWidth = 8;
const innerRX = outerRX - trackWidth;
const innerRZ = outerRZ - trackWidth;

const trackShape = new THREE.Shape();
trackShape.absellipse(0, 0, outerRX, outerRZ, 0, Math.PI * 2, false, 0);
const innerPath = new THREE.Path();
innerPath.absellipse(0, 0, innerRX, innerRZ, 0, Math.PI * 2, true, 0);
trackShape.holes.push(innerPath);

const extrudeSettings = { depth: 0.1, bevelEnabled: false };
const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const track = new THREE.Mesh(trackGeometry, trackMaterial);
track.rotation.x = -Math.PI / 2;
scene.add(track);

// Center dashed line
const centerCurvePoints = [];
for (let i = 0; i <= 100; i++) {
  const a = (i / 100) * Math.PI * 2;
  const x = (innerRX + trackWidth / 2) * Math.cos(a);
  const z = (innerRZ + trackWidth / 2) * Math.sin(a);
  centerCurvePoints.push(new THREE.Vector3(x, 0.06, z));
}
const centerCurve = new THREE.CatmullRomCurve3(centerCurvePoints, true);
const centerPoints = centerCurve.getPoints(500);
const centerGeo = new THREE.BufferGeometry().setFromPoints(centerPoints);
const lineMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1, gapSize: 1 });
const centerLine = new THREE.Line(centerGeo, lineMat);
centerLine.computeLineDistances();
scene.add(centerLine);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Camera start position
camera.position.set(outerRX, 1, 0);
camera.rotation.y = Math.PI;

let laps = 0;
let previousAngle = Math.atan2(camera.position.z / outerRZ, camera.position.x / outerRX);

let audioStarted = false;
let audioCtx, oscillator, gainNode;

function startAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();
  oscillator.type = 'sawtooth';
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = 0.3;
  oscillator.start();
}

// Controls
let speed = 0;
const maxSpeed = 40;
const accel = 20;
const brake = 30;
const friction = 10;
const turnSpeed = 1.5; // radians per second
const keys = {};

window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (!audioStarted) {
    startAudio();
    audioStarted = true;
  }
});
document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function update(delta) {
  if (keys['w'] || keys['arrowup']) {
    speed += accel * delta;
  }
  if (keys['s'] || keys['arrowdown']) {
    speed -= brake * delta;
  }
  if (keys['a'] || keys['arrowleft']) {
    camera.rotation.y += turnSpeed * delta;
  }
  if (keys['d'] || keys['arrowright']) {
    camera.rotation.y -= turnSpeed * delta;
  }

  if (!keys['w'] && !keys['arrowup'] && !keys['s'] && !keys['arrowdown']) {
    if (speed > 0) speed = Math.max(speed - friction * delta, 0);
    else if (speed < 0) speed = Math.min(speed + friction * delta, 0);
  }

  speed = Math.max(Math.min(speed, maxSpeed), -maxSpeed);

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  camera.position.add(forward.multiplyScalar(speed * delta));

  if (audioStarted && oscillator) {
    oscillator.frequency.value = 200 + Math.abs(speed) * 10;
    gainNode.gain.value = 0.2 + Math.abs(speed) / maxSpeed * 0.3;
  }

  const angle = Math.atan2(camera.position.z / outerRZ, camera.position.x / outerRX);
  if (previousAngle > Math.PI * 0.9 && angle < -Math.PI * 0.9) {
    laps += 1;
  }
  previousAngle = angle;

  const hud = document.getElementById('hud');
  if (hud) hud.innerText = `Speed: ${speed.toFixed(1)} | Laps: ${laps}`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
}

animate();
