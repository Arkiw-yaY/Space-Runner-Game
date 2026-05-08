const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const overlayMsg = document.getElementById('overlayMsg');
const scoreBox = document.getElementById('scoreBox');

const W = 660, H = 260;
const GROUND = H - 50;
const RUNNER_X = 80;

let state = 'idle';
let score, hiScore = 0, speed, frame, runner, obstacles, clouds, nextObsDist;

const C = {
  sky: '#e8f0fe',
  ground: '#d4d0c8',
  groundLine: '#b0ac9e',
  runner: '#534AB7',
  obs: '#D85A30',
  cloud: '#c8d8f8',
  scoreColor: '#534AB7'
};

function resetGame() {
  score = 0;
  speed = 4;
  frame = 0;
  nextObsDist = 120;
  runner = { y: GROUND, vy: 0, onGround: true, jumpCount: 0, legPhase: 0 };
  obstacles = [];
  clouds = [
    { x: 200, y: 40, w: 70 },
    { x: 450, y: 60, w: 50 },
    { x: 600, y: 30, w: 80 }
  ];
}

function jump() {
  if (state !== 'playing') return;
  if (runner.jumpCount < 2) {
    runner.vy = -13;
    runner.onGround = false;
    runner.jumpCount++;
  }
}

function spawnObstacle() {
  const types = ['cactus', 'cactus', 'box', 'tall'];
  const t = types[Math.floor(Math.random() * types.length)];
  let w, h;
  if (t === 'cactus') { w = 18; h = 36 + (Math.random() * 18 | 0); }
  else if (t === 'box')  { w = 28; h = 28; }
  else                   { w = 16; h = 50; }
  obstacles.push({ x: W + 20, w, h, type: t });
}

function drawRunner() {
  const x = RUNNER_X, y = runner.y;
  const phase = runner.onGround ? runner.legPhase : 0;

  ctx.fillStyle = C.runner;

  // body
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 44, 20, 22, 3);
  ctx.fill();

  // head
  ctx.beginPath();
  ctx.arc(x, y - 54, 10, 0, Math.PI * 2);
  ctx.fill();

  // legs
  const l1 = Math.sin(phase) * 10;
  const l2 = -Math.sin(phase) * 10;
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.runner;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x - 4, y - 22);
  ctx.lineTo(x - 4, y - 22 + 22 + l1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 4, y - 22);
  ctx.lineTo(x + 4, y - 22 + 22 + l2);
  ctx.stroke();

  ctx.lineWidth = 1;
}

function drawObstacle(obs) {
  ctx.fillStyle = C.obs;
  if (obs.type === 'cactus') {
    ctx.beginPath();
    ctx.roundRect(obs.x - obs.w / 2, GROUND - obs.h, obs.w, obs.h, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(obs.x - obs.w / 2 - 8, GROUND - obs.h * 0.6, 8, obs.h * 0.35, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(obs.x + obs.w / 2, GROUND - obs.h * 0.7, 8, obs.h * 0.35, 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(obs.x - obs.w / 2, GROUND - obs.h, obs.w, obs.h, 3);
    ctx.fill();
  }
}

function drawCloud(cloud) {
  ctx.fillStyle = C.cloud;
  ctx.beginPath();
  ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cloud.x - cloud.w * 0.25, cloud.y + 6, cloud.w * 0.3, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cloud.x + cloud.w * 0.25, cloud.y + 5, cloud.w * 0.28, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function collides(obs) {
  const rLeft = RUNNER_X - 8, rRight = RUNNER_X + 8;
  const rTop = runner.y - 44, rBottom = runner.y;
  const oLeft = obs.x - obs.w / 2, oRight = obs.x + obs.w / 2;
  const oTop = GROUND - obs.h, oBottom = GROUND;
  return rRight > oLeft && rLeft < oRight && rBottom > oTop && rTop < oBottom;
}

function drawScene() {
  // sky
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, W, H);

  // clouds
  clouds.forEach(cl => drawCloud(cl));

  // ground fill
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, GROUND, W, H - GROUND);

  // ground top line
  ctx.strokeStyle = C.groundLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(W, GROUND);
  ctx.stroke();

  // ground dashes
  ctx.setLineDash([20, 30]);
  const dashOff = (frame * speed) % 50;
  ctx.beginPath();
  ctx.moveTo(-dashOff, GROUND + 12);
  ctx.lineTo(W, GROUND + 12);
  ctx.stroke();
  ctx.setLineDash([]);
}

function gameLoop() {
  if (state !== 'playing') return;
  frame++;

  // physics
  runner.vy += 0.7;
  runner.y += runner.vy;
  if (runner.y >= GROUND) {
    runner.y = GROUND;
    runner.vy = 0;
    runner.onGround = true;
    runner.jumpCount = 0;
  }
  if (runner.onGround) runner.legPhase += 0.25;

  // speed ramp
  speed = 4 + score / 300;

  // spawn
  nextObsDist -= speed;
  if (nextObsDist <= 0) {
    spawnObstacle();
    nextObsDist = 160 + Math.random() * 200;
  }

  // move obstacles & clouds
  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x > -60);
  clouds.forEach(cl => { cl.x -= speed * 0.3; if (cl.x < -100) cl.x = W + 80; });

  score++;

  // collision check
  for (const obs of obstacles) {
    if (collides(obs)) {
      state = 'dead';
      hiScore = Math.max(hiScore, score);
      overlayMsg.textContent = 'Game Over';
      scoreBox.textContent = `Score: ${score}  |  Best: ${hiScore}`;
      startBtn.textContent = 'Play Again';
      overlay.style.display = 'flex';
      return;
    }
  }

  // render
  drawScene();
  obstacles.forEach(o => drawObstacle(o));
  drawRunner();

  // HUD
  ctx.fillStyle = C.scoreColor;
  ctx.font = '500 14px sans-serif';
  ctx.fillText(`Score: ${score}`, W - 110, 28);
  if (hiScore > 0) {
    ctx.font = '400 12px sans-serif';
    ctx.fillText(`Best: ${hiScore}`, W - 110, 46);
  }
  if (runner.jumpCount === 1) {
    ctx.font = '400 11px sans-serif';
    ctx.fillText('2nd jump ready', 10, 24);
  }

  requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
startBtn.addEventListener('click', () => {
  resetGame();
  state = 'playing';
  overlay.style.display = 'none';
  gameLoop();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  jump();
}, { passive: false });

// --- Initial static draw ---
drawScene();