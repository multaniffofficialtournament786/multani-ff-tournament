// ============================================
// MULTANI RUNNER - COMPLETE UPDATED VERSION
// Cartoon Character + Photos + Sounds
// ============================================

const oldCanvas = document.getElementById("gameCanvas");
if (oldCanvas) oldCanvas.remove();

document.body.innerHTML = `
<main id="runnerApp">
  <h1>MULTANI RUNNER</h1>
  <p id="runnerSubtitle">RUN • JUMP • SURVIVE</p>

  <div id="runnerStats">
    <span>SCORE: <b id="score">0</b></span>
    <span>BEST: <b id="best">0</b></span>
  </div>

  <div id="runnerGame">
    <canvas id="gameCanvas" width="400" height="600"></canvas>
  </div>

  <div id="runnerControls">
    <button id="startBtn">▶ PLAY</button>
    <button id="jumpBtn">⬆ JUMP</button>
    <button id="musicBtn">🎵 MUSIC: ON</button>
    <button id="homeBtn">🏠 HOME</button>
  </div>

  <p id="runnerMessage">PLAY dabao aur game shuru karo!</p>
</main>
`;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const ground = 500;

// ============================================
// FILE PATHS
// ============================================

// HOME aur GAME OVER photo
const homePhoto = new Image();
homePhoto.src = "./1792389240189.jpg";

// Game ke andar background photo
// Aapke diye hue GitHub link ke mutabiq nested path
const background = new Image();
background.src =
  "./multani-runner/multani-runner/multani-runner/sounds/1792388836123.jpg";

// ============================================
// SOUND FILES
// ============================================

const soundPath =
  "./multani-runner/multani-runner/multani-runner/sounds/";

const sounds = {
  run: new Audio(
    soundPath + "Goofy_Running_Sound_Effect(48k).mp3"
  ),

  jump: new Audio(
    soundPath + "Jumping___Sound_Effect__Copyright_Free_(48k).mp3"
  ),

  crash: new Audio(
    soundPath + "Sparrow_Ouch_Meme_Effect(48k).mp3"
  ),

  music: new Audio(
    soundPath +
    "Background_Music___Saraiki_Song_2024___No_Copyright_Song___Mushtaq_Khanukhel(256k).mp3"
  )
};

sounds.run.loop = true;
sounds.run.volume = 0.7;

sounds.jump.volume = 0.9;
sounds.crash.volume = 1;
sounds.music.volume = 0.35;
sounds.music.loop = true;

let musicOn = true;

function playSound(name) {
  const audio = sounds[name];

  if (!audio) return;

  try {
    audio.currentTime = 0;

    const promise = audio.play();

    if (promise && promise.catch) {
      promise.catch(error => {
        console.log("Sound load/play issue:", name, error);
      });
    }
  } catch (error) {
    console.log("Sound error:", name, error);
  }
}

function stopSound(name) {
  const audio = sounds[name];

  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
}

function startMusic() {
  if (!musicOn) return;

  sounds.music.play().catch(error => {
    console.log("Music play issue:", error);
  });
}

// ============================================
// GAME VARIABLES
// ============================================

let score = 0;
let best = Number(
  localStorage.getItem("multaniRunnerBest") || 0
);

let speed = 4;
let frame = 0;
let running = false;
let gameOver = false;
let screen = "home";

let animationId = 0;
let lastTime = 0;
let obstacleTimer = 0;
let obstacles = [];

document.getElementById("best").textContent = best;

// ============================================
// DRAW IMAGE WITH COVER FIT
// ============================================

function drawCoverImage(image, x, y, width, height) {
  if (!image.complete || !image.naturalWidth) {
    return false;
  }

  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight
  );

  const sw = width / scale;
  const sh = height / scale;

  ctx.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    width,
    height
  );

  return true;
}

// ============================================
// BACKGROUND
// ============================================

function drawBackground() {
  const loaded = drawCoverImage(
    background, 0, 0, W, H
  );

  if (!loaded) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    gradient.addColorStop(0, "#182a43");
    gradient.addColorStop(1, "#75815c");

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
    let x = -((frame * speed * 0.5) % 70);
    x < W;
    x += 70
  ) {
    ctx.fillRect(x, ground + 30, 32, 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial";
  ctx.fillText("MULTANI RUNNER", 12, 27);
}

// ============================================
// HOME SCREEN
// ============================================

function drawHomeScreen() {
  const loaded = drawCoverImage(
    homePhoto, 0, 0, W, H
  );

  if (!loaded) {
    ctx.fillStyle = "#101725";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Arial";
  ctx.fillText("MULTANI", W / 2, 105);

  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 38px Arial";
  ctx.fillText("RUNNER", W / 2, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("RUN • JUMP • SURVIVE", W / 2, 185);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial";
  ctx.fillText("Ready to Run?", W / 2, 440);

  ctx.font = "14px Arial";
  ctx.fillText("PLAY button dabao!", W / 2, 470);

  ctx.textAlign = "left";
}

// ============================================
// CARTOON CHARACTER
// ============================================

const player = {
  x: 55,
  y: ground - 84,
  w: 58,
  h: 84,
  vy: 0,
  jumping: false,
  state: "run",
  anim: 0
};

function drawFace() {
  ctx.fillStyle = "#ffffff";

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
  const x = player.x;
  const y = player.y;

  const runningPose = Math.sin(player.anim * 0.45);
  const armSwing = runningPose * 13;
  const legSwing = runningPose * 12;
  const bob = player.jumping
    ? 0
    : Math.abs(runningPose) * 2;

  ctx.save();
  ctx.translate(x + player.w / 2, y + bob);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(
    0, player.h - 1, 25, 5,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Crash pose
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

  // Legs
  ctx.strokeStyle = "#172238";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(-7, 55);
  ctx.lineTo(
    -10 + (player.jumping ? -4 : legSwing),
    72
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(7, 55);
  ctx.lineTo(
    10 - (player.jumping ? -4 : legSwing),
    72
  );
  ctx.stroke();

  // Shoes
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.ellipse(
    -13 + legSwing, 74, 12, 6,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    13 - legSwing, 74, 12, 6,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Arms
  ctx.strokeStyle = "#ffbf91";
  ctx.lineWidth = 8;

  ctx.beginPath();
  ctx.moveTo(-15, 32);
  ctx.lineTo(
    -25 - armSwing * 0.4,
    45 + armSwing * 0.3
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(15, 32);
  ctx.lineTo(
    25 + armSwing * 0.4,
    45 - armSwing * 0.3
  );
  ctx.stroke();

  // Shirt
  ctx.fillStyle = "#ff4624";
  ctx.beginPath();
  ctx.roundRect(-17, 24, 34, 36, 8);
  ctx.fill();

  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(-16, 39, 32, 5);

  // Neck
  ctx.fillStyle = "#ffbf91";
  ctx.fillRect(-6, 17, 12, 10);

  // Head
  ctx.fillStyle = "#ffbf91";
  ctx.beginPath();
  ctx.arc(0, 5, 20, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#18202c";
  ctx.beginPath();
  ctx.arc(0, -1, 20, Math.PI, Math.PI * 2);
  ctx.lineTo(18, 5);
  ctx.lineTo(-18, 5);
  ctx.closePath();
  ctx.fill();

  drawFace();

  if (player.jumping) {
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 20px Arial";
    ctx.fillText("!", 25, -20);
  }

  ctx.restore();
}

// ============================================
// BOX OBSTACLES
// ============================================

function createObstacle() {
  const h = 35 + Math.random() * 25;

  obstacles.push({
    x: W + 10,
    y: ground - h,
    w: 32,
    h: h,
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
  return (
    a.x + 12 < b.x + b.w &&
    a.x + a.w - 12 > b.x &&
    a.y + 10 < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ============================================
// JUMP
// ============================================

function jump() {
  if (!running || gameOver) return;

  if (!player.jumping) {
    player.vy = -13.5;
    player.jumping = true;
    player.state = "jump";

    playSound("jump");
  }
}

document
  .getElementById("jumpBtn")
  .addEventListener("click", jump);

canvas.addEventListener("pointerdown", () => {
  if (screen === "playing") jump();
});

// Keyboard support
document.addEventListener("keydown", event => {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp"
  ) {
    event.preventDefault();
    jump();
  }
});

// ============================================
// START GAME
// ============================================

function startGame() {
  cancelAnimationFrame(animationId);

  stopSound("run");
  stopSound("crash");
  stopSound("music");

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

  document.getElementById("runnerMessage").textContent =
    "Jump karo aur boxes se bacho!";

  document.getElementById("startBtn").textContent =
    "↻ RESTART";

  document.getElementById("homeBtn").style.display =
    "inline-block";

  // Sounds start after PLAY tap
  playSound("run");
  startMusic();

  animationId = requestAnimationFrame(loop);
}

document
  .getElementById("startBtn")
  .addEventListener("click", startGame);

// ============================================
// GAME OVER
// ============================================

function endGame() {
  if (gameOver) return;

  running = false;
  gameOver = true;
  screen = "over";
  player.state = "fall";

  stopSound("run");
  stopSound("music");

  // Ouch sound poori ek baar chalegi
  playSound("crash");

  if (score > best) {
    best = score;

    localStorage.setItem(
      "multaniRunnerBest",
      String(best)
    );

    document.getElementById("best").textContent = best;
  }

  document.getElementById("runnerMessage").textContent =
    "Game Over! PLAY AGAIN dabao.";

  document.getElementById("startBtn").textContent =
    "↻ PLAY AGAIN";

  drawGameOver();
}

function drawGameOver() {
  const loaded = drawCoverImage(
    homePhoto, 0, 0, W, H
  );

  if (!loaded) {
    ctx.fillStyle = "#101725";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(20, 180, 360, 230);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 34px Arial";
  ctx.fillText("GAME OVER", W / 2, 230);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Score: " + score, W / 2, 280);

  ctx.fillText("Best: " + best, W / 2, 320);

  ctx.font = "16px Arial";
  ctx.fillText("PLAY AGAIN ya HOME dabao", W / 2, 365);

  ctx.textAlign = "left";
}

// ============================================
// HOME BUTTON
// ============================================

function goHome() {
  cancelAnimationFrame(animationId);

  running = false;
  gameOver = false;
  screen = "home";

  stopSound("run");
  stopSound("music");
  stopSound("jump");

  obstacles = [];
  score = 0;
  speed = 4;
  frame = 0;

  player.y = ground - player.h;
  player.vy = 0;
  player.jumping = false;
  player.state = "run";
  player.anim = 0;

  document.getElementById("score").textContent = "0";

  document.getElementById("startBtn").textContent =
    "▶ PLAY";

  document.getElementById("runnerMessage").textContent =
    "PLAY dabao aur game shuru karo!";

  drawHomeScreen();
}

document
  .getElementById("homeBtn")
  .addEventListener("click", goHome);

// ============================================
// GAME LOOP
// ============================================

function loop(time = 0) {
  if (!running) return;

  const delta = lastTime
    ? Math.min((time - lastTime) / 16.67, 2)
    : 1;

  lastTime = time;
  frame += delta;
  player.anim += delta;

  drawBackground();

  // Jump physics
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
    if (player.anim > 10) {
      player.state = "run";
      player.anim = 0;
    }
  } else {
    player.state = "run";
  }

  // Spawn boxes
  obstacleTimer += delta;

  if (obstacleTimer > 95) {
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

      document.getElementById("score").textContent =
        score;
    }

    if (ob.x + ob.w < 0) {
      obstacles.splice(i, 1);
    }
  }

  drawCartoon();

  animationId = requestAnimationFrame(loop);
}

// ============================================
// MUSIC ON / OFF
// ============================================

document
  .getElementById("musicBtn")
  .addEventListener("click", () => {
    musicOn = !musicOn;

    document.getElementById("musicBtn").textContent =
      "🎵 MUSIC: " + (musicOn ? "ON" : "OFF");

    if (musicOn) {
      if (running) {
        startMusic();
      }
    } else {
      stopSound("music");
    }
  });

// ============================================
// INITIAL HOME SCREEN
// ============================================

function initialScreen() {
  screen = "home";
  drawHomeScreen();
}

homePhoto.onload = () => {
  if (screen === "home") drawHomeScreen();
  if (screen === "over") drawGameOver();
};

background.onerror = () => {
  console.error(
    "Background photo nahi mili:",
    background.src
  );
};

homePhoto.onerror = () => {
  console.error(
    "HOME/GAME OVER photo nahi mili:",
    homePhoto.src
  );
};

for (const [name, audio] of Object.entries(sounds)) {
  audio.addEventListener("error", () => {
    console.error("Sound file nahi mili:", name, audio.src);
  });
}

initialScreen();
