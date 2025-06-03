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

// Track
const trackWidth = 10;
const trackLength = 1000;
const trackGeometry = new THREE.PlaneGeometry(trackWidth, trackLength);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const track = new THREE.Mesh(trackGeometry, trackMaterial);
track.rotation.x = -Math.PI / 2;
track.position.z = -trackLength / 2;
scene.add(track);

// Center dashed line
const dashLength = 5;
const dashGap = 3;
const dashGeometry = new THREE.BoxGeometry(0.2, 0.01, dashLength);
const dashMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
for (let z = -dashGap; z > -trackLength; z -= dashLength + dashGap) {
  const dash = new THREE.Mesh(dashGeometry, dashMaterial);
  dash.position.set(0, 0.01, z - dashLength / 2);
  scene.add(dash);
}

// Track walls
const wallHeight = 1;
const wallThickness = 0.5;
const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, trackLength);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-trackWidth / 2, wallHeight / 2, -trackLength / 2);
scene.add(leftWall);
const rightWall = leftWall.clone();
rightWall.position.x = trackWidth / 2;
scene.add(rightWall);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Camera start position
camera.position.set(0, 1, 0);

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

  const hud = document.getElementById('hud');
  if (hud) hud.innerText = `Speed: ${speed.toFixed(1)}`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  update(delta);
  renderer.render(scene, camera);
}

animate();
