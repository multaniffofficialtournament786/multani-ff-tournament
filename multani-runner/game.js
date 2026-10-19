// ============================================
// MULTANI RUNNER - FIXED GAME
// HOME PHOTO + GAME BACKGROUND + SOUNDS
// ============================================

const oldCanvas = document.getElementById("gameCanvas");
if (oldCanvas) oldCanvas.remove();

document.body.innerHTML = `
<main id="runnerApp">
  <h1>MULTANI RUNNER</h1>
  <p>RUN • JUMP • SURVIVE</p>

  <div id="runnerStats">
    <span>SCORE: <b id="score">0</b></span>
    <span>BEST: <b id="best">0</b></span>
  </div>

  <canvas id="gameCanvas" width="400" height="600"
    style="width:100%;max-width:400px;display:block;margin:auto;border-radius:12px">
  </canvas>

  <div id="runnerControls">
    <button id="startBtn">▶ PLAY</button>
    <button id="jumpBtn">⬆ JUMP</button>
    <button id="musicBtn">🎵 MUSIC: ON</button>
    <button id="homeBtn">🏠 HOME</button>
  </div>

  <p id="runnerMessage">PLAY dabao aur game shuru karo!</p>
  <p id="fileStatus" style="font-size:12px;overflow-wrap:anywhere"></p>
</main>
`;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const ground = 500;

// Agar game.js pehle multani-runner folder mein hai,
// to yeh path nested folder tak jayega.
const ASSET_DIR =
  "./multani-runner/multani-runner/multani-runner/sounds/";

const homePhoto = new Image();
homePhoto.src = "./1792389240189.jpg";

const background = new Image();
background.src = ASSET_DIR + "1792388836123.jpg";

const sounds = {
  run: new Audio(ASSET_DIR + "Goofy_Running_Sound_Effect(48k).mp3"),
  jump: new Audio(ASSET_DIR + "Jumping___Sound_Effect__Copyright_Free_(48k).mp3"),
  crash: new Audio(ASSET_DIR + "Sparrow_Ouch_Meme_Effect(48k).mp3"),
  music: new Audio(ASSET_DIR + "Background_Music___Saraiki_Song_2024___No_Copyright_Song___Mushtaq_Khanukhel(256k).mp3")
};

sounds.run.loop = true;
sounds.music.loop = true;
sounds.run.volume = 0.65;
sounds.music.volume = 0.35;

let score = 0;
let best = Number(localStorage.getItem("multaniRunnerBest") || 0);
let speed = 4;
let frame = 0;
let running = false;
let gameOver = false;
let screen = "home";
let musicOn = true;
let animationId = 0;
let lastTime = 0;
let obstacleTimer = 0;
let obstacles = [];

document.getElementById("best").textContent = best;

function showStatus(message) {
  document.getElementById("fileStatus").textContent = message;
}

function drawCover(img) {
  if (!img.complete || !img.naturalWidth) return false;

  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const sw = W / scale;
  const sh = H / scale;

  ctx.drawImage(
    img,
    (img.naturalWidth - sw) / 2,
    (img.naturalHeight - sh) / 2,
    sw, sh, 0, 0, W, H
  );
  return true;
}

homePhoto.onerror = () => showStatus("HOME photo load nahi hui: " + homePhoto.src);
background.onerror = () => showStatus("Background file nahi mili: " + background.src);

for (const [name, audio] of Object.entries(sounds)) {
  audio.addEventListener("error", () => {
    showStatus("Sound file nahi mili: " + name + " — " + audio.src);
  });
}

function stopAudio(name) {
  const audio = sounds[name];
  audio.pause();
  audio.currentTime = 0;
}

function playAudio(name) {
  const audio = sounds[name];
  audio.currentTime = 0;
  audio.play().catch(() => {
    showStatus("Sound chalane ke liye PLAY ya MUSIC button dobara dabao.");
  });
}

const player = {
  x: 55, y: ground - 84, w: 58, h: 84,
  vy: 0, jumping: false, state: "run", anim: 0
};

function drawBackground() {
  if (!drawCover(background)) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#182a43");
    gradient.addColorStop(1, "#75815c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "#292e36";
  ctx.fillRect(0, ground, W, H - ground);
  ctx.fillStyle = "#ff4624";
  ctx.fillRect(0, ground, W, 4);

  ctx.fillStyle = "#ffb347";
  for (let x = -((frame * speed * 0.5) % 70); x < W; x += 70) {
    ctx.fillRect(x, ground + 30, 32, 4);
  }

  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px Arial";
  ctx.fillText("MULTANI RUNNER", 12, 27);
}

function drawHome() {
  if (!drawCover(homePhoto)) {
    ctx.fillStyle = "#101725";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,.48)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("MULTANI", W / 2, 110);
  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 38px Arial";
  ctx.fillText("RUNNER", W / 2, 155);
  ctx.fillStyle = "#fff";
  ctx.font = "17px Arial";
  ctx.fillText("RUN • JUMP • SURVIVE", W / 2, 190);
  ctx.textAlign = "left";
}

function drawFace() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-7, 5, 5, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(7, 5, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#18202c";
  ctx.beginPath();
  ctx.arc(-5, 6, 2.5, 0, Math.PI * 2);
  ctx.arc(9, 6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#713c2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 10, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawCartoon() {
  const swing = Math.sin(player.anim * 0.45);
  const legSwing = swing * 12;
  const armSwing = swing * 13;

  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + (player.jumping ? 0 : Math.abs(swing) * 2));

  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(0, player.h - 1, 25, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.state === "fall") {
    ctx.rotate(0.8);
    ctx.fillStyle = "#ff4624";
    ctx.fillRect(-19, 23, 38, 30);
    ctx.fillStyle = "#ffbf91";
    ctx.beginPath();
    ctx.arc(0, 12, 18, 0, Math.PI * 2);
    ctx.fill();
    drawFace();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = "#172238";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(-7, 55);
  ctx.lineTo(-10 + (player.jumping ? -4 : legSwing), 72);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(7, 55);
  ctx.lineTo(10 - (player.jumping ? -4 : legSwing), 72);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-13 + legSwing, 74, 12, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(13 - legSwing, 74, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffbf91";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-15, 32);
  ctx.lineTo(-25 - armSwing * 0.4, 45 + armSwing * 0.3);
  ctx.moveTo(15, 32);
  ctx.lineTo(25 + armSwing * 0.4, 45 - armSwing * 0.3);
  ctx.stroke();

  ctx.fillStyle = "#ff4624";
  ctx.beginPath();
  ctx.roundRect(-17, 24, 34, 36, 8);
  ctx.fill();
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(-16, 39, 32, 5);

  ctx.fillStyle = "#ffbf91";
  ctx.fillRect(-6, 17, 12, 10);
  ctx.beginPath();
  ctx.arc(0, 5, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#18202c";
  ctx.beginPath();
  ctx.arc(0, -1, 20, Math.PI, Math.PI * 2);
  ctx.lineTo(18, 5);
  ctx.lineTo(-18, 5);
  ctx.closePath();
  ctx.fill();

  drawFace();
  ctx.restore();
}

function createObstacle() {
  const h = 35 + Math.random() * 25;
  obstacles.push({ x: W + 10, y: ground - h, w: 32, h, passed: false });
}

function drawObstacle(ob) {
  ctx.fillStyle = "#a85a28";
  ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  ctx.fillStyle = "#ffb347";
  ctx.fillRect(ob.x + 3, ob.y + 5, ob.w - 6, 5);
  ctx.strokeStyle = "#ffe0a3";
  ctx.lineWidth = 2;
  ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
}

function collision(a, b) {
  return a.x + 12 < b.x + b.w &&
    a.x + a.w - 12 > b.x &&
    a.y + 10 < b.y + b.h &&
    a.y + a.h > b.y;
}

function jump() {
  if (!running || gameOver || player.jumping) return;
  player.vy = -13.5;
  player.jumping = true;
  player.state = "jump";
  playAudio("jump");
}

document.getElementById("jumpBtn").addEventListener("click", jump);
canvas.addEventListener("pointerdown", () => {
  if (screen === "playing") jump();
});

function startGame() {
  cancelAnimationFrame(animationId);
  stopAudio("run");
  stopAudio("music");
  stopAudio("crash");

  score = 0;
  speed = 4;
  frame = 0;
  obstacleTimer = 0;
  obstacles = [];

  player.y = ground - player.h;
  player.vy = 0;
  player.jumping = false;
  player.state = "run";
  player.anim = 0;

  running = true;
  gameOver = false;
  screen = "playing";
  lastTime = 0;

  document.getElementById("score").textContent = "0";
  document.getElementById("runnerMessage").textContent = "Jump karo aur boxes se bacho!";
  document.getElementById("startBtn").textContent = "↻ RESTART";

  playAudio("run");
  if (musicOn) playAudio("music");

  animationId = requestAnimationFrame(loop);
}

document.getElementById("startBtn").addEventListener("click", startGame);

function endGame() {
  if (gameOver) return;

  running = false;
  gameOver = true;
  screen = "over";
  player.state = "fall";

  stopAudio("run");
  stopAudio("music");
  playAudio("crash");

  if (score > best) {
    best = score;
    localStorage.setItem("multaniRunnerBest", String(best));
    document.getElementById("best").textContent = best;
  }

  document.getElementById("runnerMessage").textContent = "GAME OVER!";
  document.getElementById("startBtn").textContent = "↻ PLAY AGAIN";
  drawGameOver();
}

function drawGameOver() {
  if (!drawCover(homePhoto)) {
    ctx.fillStyle = "#101725";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,.72)";
  ctx.fillRect(20, 180, 360, 230);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 34px Arial";
  ctx.fillText("GAME OVER", 200, 230);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Score: " + score, 200, 280);
  ctx.fillText("Best: " + best, 200, 320);
  ctx.font = "16px Arial";
  ctx.fillText("PLAY AGAIN ya HOME dabao", 200, 365);
  ctx.textAlign = "left";
}

function goHome() {
  cancelAnimationFrame(animationId);
  running = false;
  gameOver = false;
  screen = "home";

  for (const name of Object.keys(sounds)) stopAudio(name);

  obstacles = [];
  score = 0;
  speed = 4;
  frame = 0;
  player.y = ground - player.h;
  player.vy = 0;
  player.jumping = false;
  player.state = "run";

  document.getElementById("score").textContent = "0";
  document.getElementById("startBtn").textContent = "▶ PLAY";
  document.getElementById("runnerMessage").textContent = "PLAY dabao aur game shuru karo!";
  drawHome();
}

document.getElementById("homeBtn").addEventListener("click", goHome);

function loop(time = 0) {
  if (!running) return;

  const delta = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
  lastTime = time;
  frame += delta;
  player.anim += delta;

  drawBackground();

  if (player.jumping) {
    player.vy += 0.62 * delta;
    player.y += player.vy * delta;

    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.jumping = false;
      player.state = "land";
      player.anim = 0;
    }
  } else if (player.state === "land") {
    if (player.anim > 10) player.state = "run";
  } else {
    player.state = "run";
  }

  obstacleTimer += delta;
  if (obstacleTimer > 95) {
    createObstacle();
    obstacleTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= speed * delta;
    drawObstacle(ob);

    if (collision(player, ob)) {
      endGame();
      return;
    }

    if (!ob.passed && ob.x + ob.w < player.x) {
      ob.passed = true;
      score++;
      speed = Math.min(8, 4 + score * 0.08);
      document.getElementById("score").textContent = score;
    }

    if (ob.x + ob.w < 0) obstacles.splice(i, 1);
  }

  drawCartoon();
  animationId = requestAnimationFrame(loop);
}

document.getElementById("musicBtn").addEventListener("click", () => {
  musicOn = !musicOn;
  document.getElementById("musicBtn").textContent = "🎵 MUSIC: " + (musicOn ? "ON" : "OFF");

  if (musicOn && running) playAudio("music");
  else stopAudio("music");
});

document.getElementById("homeBtn").style.display = "inline-block";

homePhoto.onload = () => {
  if (screen === "home") drawHome();
  if (screen === "over") drawGameOver();
};

background.onload = () => {
  if (screen === "playing") drawBackground();
};

drawHome();
