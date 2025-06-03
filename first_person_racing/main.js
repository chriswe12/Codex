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
let audioCtx, oscillator, oscillator2, filter, gainNode;

function startAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  oscillator = audioCtx.createOscillator();
  oscillator2 = audioCtx.createOscillator();
  filter = audioCtx.createBiquadFilter();
  gainNode = audioCtx.createGain();

  oscillator.type = 'sawtooth';
  oscillator2.type = 'square';
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  oscillator.connect(filter);
  oscillator2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.value = 0.3;
  oscillator.start();
  oscillator2.start();
}

// Controls
let speed = 0; // meters per second
const turnSpeed = 1.5; // radians per second
const keys = {};

// Advanced vehicle physics parameters
const mass = 1200; // kg
const wheelRadius = 0.34; // meters
const engineForce = 9000; // N at full throttle
const brakeForce = 15000; // N
const dragCoeff = 0.4257; // N/(m/s)^2
const rollingResistance = 12.8; // N/(m/s)
const gearRatios = [3.166, 1.882, 1.296, 0.972, 0.738];
const finalDrive = 3.42;
const idleRpm = 800;
const maxRpm = 7000;
let gear = 1;
let rpm = idleRpm;

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
  const throttle = keys['w'] || keys['arrowup'] ? 1 : 0;
  const brakeInput = keys['s'] || keys['arrowdown'] ? 1 : 0;
  let steer = 0;
  if (keys['a'] || keys['arrowleft']) steer += 1;
  if (keys['d'] || keys['arrowright']) steer -= 1;

  const drive = throttle * engineForce;
  const drag = dragCoeff * speed * speed * Math.sign(speed);
  const rolling = rollingResistance * speed;
  const braking = brakeInput * brakeForce * Math.sign(speed);

  const netForce = drive - drag - rolling - braking;
  const acceleration = netForce / mass;
  speed += acceleration * delta;
  if (Math.abs(speed) < 0.01 && throttle === 0 && brakeInput === 0) speed = 0;

  camera.rotation.y += steer * turnSpeed * delta * Math.min(Math.abs(speed) / 5 + 1, 2);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  camera.position.add(forward.multiplyScalar(speed * delta));

  const wheelRpm = (Math.abs(speed) / (2 * Math.PI * wheelRadius)) * 60;
  rpm = Math.max(idleRpm, Math.min(wheelRpm * gearRatios[gear - 1] * finalDrive, maxRpm));

  if (rpm > 6500 && gear < gearRatios.length) gear++;
  else if (rpm < 2500 && gear > 1) gear--;

  if (audioStarted && oscillator) {
    const freq = (rpm / 60) * 4;
    oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
    oscillator2.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
    filter.frequency.setTargetAtTime(1000 + throttle * 4000, audioCtx.currentTime, 0.05);
    gainNode.gain.setTargetAtTime(0.2 + throttle * 0.5, audioCtx.currentTime, 0.05);
  }

  const angle = Math.atan2(camera.position.z / outerRZ, camera.position.x / outerRX);
  if (previousAngle > Math.PI * 0.9 && angle < -Math.PI * 0.9) {
    laps += 1;
  }
  previousAngle = angle;

  const hud = document.getElementById('hud');
  if (hud) hud.innerText = `Speed: ${(speed * 3.6).toFixed(1)} km/h | Gear: ${gear} | Laps: ${laps}`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
}

animate();
