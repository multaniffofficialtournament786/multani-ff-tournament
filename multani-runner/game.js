// ==========================================
// MULTANI RUNNER - GAME ENGINE
// ==========================================

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
canvas.width = 400;
canvas.height = 600;

const ctx = canvas.getContext("2d");

document.body.innerHTML = `
  <main id="runnerApp">
    <h1>MULTANI RUNNER</h1>
    <p id="runnerSubtitle">RUN • JUMP • SURVIVE</p>

    <div id="runnerStats">
      <span>SCORE: <b id="score">0</b></span>
      <span>BEST: <b id="best">0</b></span>
    </div>

    <div id="runnerGame"></div>

    <div id="runnerControls">
      <button id="startBtn">▶ PLAY</button>
      <button id="jumpBtn">⬆ JUMP</button>
      <button id="musicBtn">🎵 MUSIC: OFF</button>
    </div>

    <p id="runnerMessage">PLAY dabao aur game shuru karo!</p>
  </main>
`;

document.getElementById("runnerGame").appendChild(canvas);

// ------------------------------------------
// GAME SETTINGS
// ------------------------------------------

const W = canvas.width;
const H = canvas.height;
const ground = 500;

let score = 0;
let best = Number(localStorage.getItem("multaniRunnerBest") || 0);
let speed = 4;
let frame = 0;
let running = false;
let gameOver = false;
let animationId = 0;
let lastTime = 0;
let obstacleTimer = 0;
let obstacles = [];
let musicOn = false;

document.getElementById("best").textContent = best;

// ------------------------------------------
// ASSETS
// ------------------------------------------

const character = new Image();
character.src = "1792384226317.jpg";

const background = new Image();
background.src = "1792388836123.jpg";

const gameIcon = new Image();
gameIcon.src = "1792389240189.jpg";

const sounds = {
  start: new Audio(
    "sounds/Goofy_Running_Sound_Effect(48k).mp3"
  ),

  jump: new Audio(
    "sounds/Jumping___Sound_Effect__Copyright_Free_(48k).mp3"
  ),

  crash: new Audio(
    "sounds/Sparrow_Ouch_Meme_Effect(48k).mp3"
  ),

  music: new Audio(
    "sounds/Background_Music___Saraiki_Song_2024___No_Copyright_Song___Mushtaq_Khanukhel(256k).mp3"
  )
};

sounds.music.loop = true;
sounds.music.volume = 0.35;

sounds.start.volume = 0.8;
sounds.jump.volume = 0.8;
sounds.crash.volume = 0.9;

function playSound(name) {
  const audio = sounds[name];

  if (!audio) return;

  try {
    audio.currentTime = 0;

    const promise = audio.play();

    if (promise) promise.catch(() => {});
  } catch (error) {
    console.log("Audio error:", error);
  }
}

// ------------------------------------------
// PLAYER
// ------------------------------------------

const player = {
  x: 55,
  y: ground - 92,
  w: 72,
  h: 92,
  vy: 0,
  jumping: false,
  anim: 0,
  state: "run"
};

// Sprite sheet: 4 rows.
// Row 1: 7 running frames
// Row 2: 4 jumping frames
// Row 3: 4 landing frames
// Row 4: 3 falling frames

const spriteRows = [
  { count: 7, row: 0 },
  { count: 4, row: 1 },
  { count: 4, row: 2 },
  { count: 3, row: 3 }
];

function getSpriteFrame() {
  if (player.state === "jump") return spriteRows[1];
  if (player.state === "land") return spriteRows[2];
  if (player.state === "fall") return spriteRows[3];

  return spriteRows[0];
}

function drawPlayer() {
  if (!character.complete || !character.naturalWidth) {
    // Temporary fallback until the image loads.
    ctx.fillStyle = "#ff4624";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText("RUNNER", player.x + 5, player.y + 45);
    return;
  }

  const rowData = getSpriteFrame();

  const sourceRowHeight = character.naturalHeight / 4;
  const sourceFrameWidth = character.naturalWidth / rowData.count;

  const animationSpeed = player.state === "run" ? 7 : 10;

  const frameIndex =
    Math.floor(player.anim / animationSpeed) % rowData.count;

  const sx = frameIndex * sourceFrameWidth;
  const sy = rowData.row * sourceRowHeight;

  ctx.drawImage(
    character,
    sx,
    sy,
    sourceFrameWidth,
    sourceRowHeight,
    player.x,
    player.y,
    player.w,
    player.h
  );
}

// ------------------------------------------
// BACKGROUND
// ------------------------------------------

function drawBackground() {
  if (background.complete && background.naturalWidth) {
    const scale = Math.max(
      W / background.naturalWidth,
      H / background.naturalHeight
    );

    const sw = W / scale;
    const sh = H / scale;

    const sx = (background.naturalWidth - sw) / 2;
    const sy = (background.naturalHeight - sh) / 2;

    ctx.drawImage(
      background,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      W,
      H
    );

    // Dark overlay for game visibility.
    ctx.fillStyle = "rgba(5, 10, 20, 0.24)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    gradient.addColorStop(0, "#182a43");
    gradient.addColorStop(1, "#586b54");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  // Road
  ctx.fillStyle = "#292e36";
  ctx.fillRect(0, ground, W, H - ground);

  ctx.fillStyle = "#ff4624";
  ctx.fillRect(0, ground, W, 4);

  ctx.fillStyle = "#ffb347";

  for (
    let x = -(frame * speed * 0.5 % 70);
    x < W;
    x += 70
  ) {
    ctx.fillRect(x, ground + 30, 32, 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial";
  ctx.fillText("MULTANI RUNNER", 12, 27);
}

// ------------------------------------------
// OBSTACLES
// ------------------------------------------

function createObstacle() {
  const height = 35 + Math.random() * 25;

  obstacles.push({
    x: W + 10,
    y: ground - height,
    w: 32,
    h: height,
    passed: false
  });
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
  const margin = 12;

  return (
    a.x + margin < b.x + b.w &&
    a.x + a.w - margin > b.x &&
    a.y + 10 < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ------------------------------------------
// JUMP
// ------------------------------------------

function jump() {
  if (!running || gameOver) return;

  if (!player.jumping) {
    player.vy = -13.5;
    player.jumping = true;
    player.state = "jump";
    player.anim = 0;

    playSound("jump");
  }
}

document.getElementById("jumpBtn").addEventListener("click", jump);

canvas.addEventListener("pointerdown", jump);

// ------------------------------------------
// START GAME
// ------------------------------------------

function startGame() {
  cancelAnimationFrame(animationId);

  score = 0;
  speed = 4;
  frame = 0;
  obstacleTimer = 0;
  obstacles = [];

  player.y = ground - player.h;
  player.vy = 0;
  player.jumping = false;
  player.anim = 0;
  player.state = "run";

  running = true;
  gameOver = false;
  lastTime = 0;

  document.getElementById("score").textContent = "0";

  document.getElementById("runnerMessage").textContent =
    "Jump karo aur boxes se bacho!";

  document.getElementById("startBtn").textContent = "↻ RESTART";

  playSound("start");

  if (musicOn) {
    sounds.music.play().catch(() => {});
  }

  animationId = requestAnimationFrame(loop);
}

document.getElementById("startBtn").addEventListener(
  "click",
  startGame
);

// ------------------------------------------
// END GAME
// ------------------------------------------

function endGame() {
  if (gameOver) return;

  running = false;
  gameOver = true;

  player.state = "fall";
  player.anim = 0;

  playSound("crash");

  if (score > best) {
    best = score;

    localStorage.setItem("multaniRunnerBest", String(best));

    document.getElementById("best").textContent = best;
  }

  document.getElementById("runnerMessage").textContent =
    "GAME OVER! Dobara khelne ke liye PLAY dabao.";

  document.getElementById("startBtn").textContent = "↻ PLAY AGAIN";

  drawGameOver();

  cancelAnimationFrame(animationId);
}

// ------------------------------------------
// GAME LOOP
// ------------------------------------------

function loop(time = 0) {
  if (!running) return;

  const delta = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;

  lastTime = time;

  frame += delta;
  player.anim += delta;

  drawBackground();

  // Player physics
  if (player.jumping) {
    player.vy += 0.62 * delta;
    player.y += player.vy * delta;

    if (player.vy > 0) {
      player.state = "jump";
    }

    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.jumping = false;
      player.state = "land";
      player.anim = 0;
    }
  } else if (player.state === "land") {
    if (player.anim > 15) {
      player.state = "run";
      player.anim = 0;
    }
  } else {
    player.state = "run";
  }

  // Create boxes
  obstacleTimer += delta;

  if (obstacleTimer > 85 + Math.random() * 30) {
    createObstacle();
    obstacleTimer = 0;
  }

  // Move boxes
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

    if (ob.x + ob.w < 0) {
      obstacles.splice(i, 1);
    }
  }

  drawPlayer();

  animationId = requestAnimationFrame(loop);
}

// ------------------------------------------
// GAME OVER SCREEN
// ------------------------------------------

function drawGameOver() {
  drawBackground();
  drawPlayer();

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(20, 200, 360, 170);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 32px Arial";
  ctx.fillText("GAME OVER", 200, 245);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 200, 290);
  ctx.fillText("Best: " + best, 200, 325);

  ctx.textAlign = "left";
}

// ------------------------------------------
// MUSIC ON / OFF
// ------------------------------------------

document.getElementById("musicBtn").addEventListener("click", () => {
  musicOn = !musicOn;

  document.getElementById("musicBtn").textContent =
    "🎵 MUSIC: " + (musicOn ? "ON" : "OFF");

  if (musicOn) {
    if (running) {
      sounds.music.play().catch(() => {});
    }
  } else {
    sounds.music.pause();
    sounds.music.currentTime = 0;
  }
});

// ------------------------------------------
// INITIAL SCREEN
// ------------------------------------------

function drawStartScreen() {
  drawBackground();

  player.y = ground - player.h;
  player.state = "run";
  player.anim++;

  drawPlayer();

  if (!running && !gameOver) {
    animationId = requestAnimationFrame(drawStartScreen);
  }
}

drawStartScreen();
