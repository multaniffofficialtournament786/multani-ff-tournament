// ======================================
// MULTANI RUNNER - COMPLETE GAME
// ======================================

document.body.innerHTML = `
<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 12px;
  background: #080b12;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}

#gameBox {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
}

#gameTitle {
  color: #ff4624;
  font-size: 28px;
  font-weight: 900;
  margin: 8px 0 12px;
  text-shadow: 0 0 12px #ff4624;
}

#gameCanvas {
  display: block;
  width: 100%;
  max-width: 400px;
  height: auto;
  margin: 0 auto;
  border: 2px solid #ff4624;
  border-radius: 12px;
  background: #101722;
  touch-action: manipulation;
}

#gameInfo {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  margin: 12px auto;
  font-weight: bold;
  color: #ffb347;
}

.gameButton {
  border: 0;
  border-radius: 9px;
  padding: 12px 17px;
  margin: 5px;
  font-size: 15px;
  font-weight: 900;
  background: #ff4624;
  color: white;
  cursor: pointer;
  touch-action: manipulation;
}

.gameButton:active {
  transform: scale(0.96);
}

#jumpBtn {
  background: #00a9c7;
}

#musicBtn {
  background: #303744;
}

#gameMessage {
  color: #b9c3d5;
  font-size: 12px;
  margin: 8px;
  overflow-wrap: anywhere;
}
</style>

<div id="gameBox">
  <div id="gameTitle">MULTANI RUNNER</div>

  <div id="gameInfo">
    <div>SCORE: <span id="score">0</span></div>
    <div>BEST: <span id="best">0</span></div>
  </div>

  <canvas id="gameCanvas" width="400" height="600"></canvas>

  <div>
    <button id="playBtn" class="gameButton">PLAY GAME</button>
    <button id="jumpBtn" class="gameButton">JUMP</button>
  </div>

  <div>
    <button id="homeBtn" class="gameButton">HOME</button>
    <button id="musicBtn" class="gameButton">MUSIC: ON</button>
  </div>

  <div id="gameMessage">Loading game assets...</div>
</div>
`;

// ======================================
// ASSET LINKS
// ======================================

const HOME_IMAGE_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/1792389240189.jpg";

const BACKGROUND_IMAGE_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/1792388836123.jpg";

const MUSIC_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Background_Music___Saraiki_Song_2024___No_Copyright_Song___Mushtaq_Khanukhel(256k).mp3";

const RUN_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Goofy_Running_Sound_Effect(48k).mp3";

const JUMP_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Jumping___Sound_Effect__Copyright_Free_(48k).mp3";

const CRASH_URL =
"https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Sparrow_Ouch_Meme_Effect(48k).mp3";

// ======================================
// ELEMENTS
// ======================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const messageElement = document.getElementById("gameMessage");

const playBtn = document.getElementById("playBtn");
const jumpBtn = document.getElementById("jumpBtn");
const homeBtn = document.getElementById("homeBtn");
const musicBtn = document.getElementById("musicBtn");

// ======================================
// IMAGES
// ======================================

const homeImage = new Image();
homeImage.src = HOME_IMAGE_URL;

const backgroundImage = new Image();
backgroundImage.src = BACKGROUND_IMAGE_URL;

homeImage.onload = () => {
  if (screen === "home" || screen === "over") drawScreen();
};

homeImage.onerror = () => {
  messageElement.textContent =
    "HOME photo load nahi hui. Image link check karein.";
};

backgroundImage.onerror = () => {
  messageElement.textContent =
    "Background photo load nahi hui. Link check karein.";
};

backgroundImage.onload = () => {
  messageElement.textContent = "Background photo loaded.";
  if (screen === "game") drawScreen();
};

// ======================================
// SOUNDS
// ======================================

const music = new Audio(MUSIC_URL);
music.loop = true;
music.volume = 0.35;

const runSound = new Audio(RUN_URL);
runSound.loop = true;
runSound.volume = 0.55;

const jumpSound = new Audio(JUMP_URL);
jumpSound.volume = 0.8;

const crashSound = new Audio(CRASH_URL);
crashSound.volume = 1;

let musicEnabled = true;

function playSound(audio, restart = true) {
  try {
    if (restart) audio.currentTime = 0;

    const promise = audio.play();

    if (promise && promise.catch) {
      promise.catch(() => {
        messageElement.textContent =
          "Sound start nahi hua. PLAY button dobara dabayein.";
      });
    }
  } catch (error) {
    console.log("Audio error:", error);
  }
}

function stopSound(audio) {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch (error) {}
}

function startMusic() {
  if (musicEnabled) {
    playSound(music, false);
  }
}

function stopGameSounds() {
  stopSound(runSound);
}

// ======================================
// GAME VARIABLES
// ======================================

const ground = 510;

let screen = "home";
let running = false;
let gameOver = false;
let frame = 0;
let score = 0;
let speed = 4;
let obstacles = [];
let lastTime = 0;
let animationId = 0;

let best = 0;

try {
  best = Number(localStorage.getItem("multaniRunnerBest") || 0);
} catch (error) {}

bestElement.textContent = best;

const player = {
  x: 62,
  y: ground - 65,
  w: 42,
  h: 65,
  vy: 0,
  jumping: false
};

// ======================================
// DRAW BACKGROUND IMAGE
// ======================================

function drawCover(image) {
  if (!image.complete || !image.naturalWidth) return false;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvas.width / canvas.height;

  let width, height, x, y;

  if (imageRatio > canvasRatio) {
    height = canvas.height;
    width = height * imageRatio;
    x = (canvas.width - width) / 2;
    y = 0;
  } else {
    width = canvas.width;
    height = width / imageRatio;
    x = 0;
    y = (canvas.height - height) / 2;
  }

  ctx.drawImage(image, x, y, width, height);
  return true;
}

// ======================================
// CARTOON PLAYER
// ======================================

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(
    x + player.w / 2,
    ground + 2,
    28,
    7,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Legs
  ctx.fillStyle = "#151515";

  const legMove = running && !player.jumping
    ? Math.sin(frame * 0.35) * 7
    : 0;

  ctx.fillRect(x + 5, y + 48, 13, 17 + legMove);
  ctx.fillRect(x + 25, y + 48, 13, 17 - legMove);

  // Shoes
  ctx.fillStyle = "#ffb347";
  ctx.fillRect(x + 1, y + 59 + legMove, 20, 6);
  ctx.fillRect(x + 22, y + 59 - legMove, 20, 6);

  // Body
  ctx.fillStyle = "#ff4624";
  ctx.fillRect(x + 3, y + 21, 36, 31);

  // Shirt details
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(x + 18, y + 24, 6, 25);

  // Arms
  ctx.fillStyle = "#ffb36b";

  ctx.save();
  ctx.translate(x + 5, y + 25);
  ctx.rotate(Math.sin(frame * 0.3) * 0.35);
  ctx.fillRect(-4, 0, 9, 25);
  ctx.restore();

  ctx.save();
  ctx.translate(x + 35, y + 25);
  ctx.rotate(-Math.sin(frame * 0.3) * 0.35);
  ctx.fillRect(-2, 0, 9, 25);
  ctx.restore();

  // Head
  ctx.fillStyle = "#ffb36b";
  ctx.fillRect(x + 8, y, 28, 25);

  // Hair
  ctx.fillStyle = "#171717";
  ctx.fillRect(x + 6, y - 4, 32, 9);
  ctx.fillRect(x + 6, y, 7, 12);

  // Eyes
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 27, y + 9, 4, 4);
}

// ======================================
// BOX OBSTACLE
// ======================================

function drawObstacle(ob) {
  ctx.fillStyle = "#ff4624";
  ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

  ctx.strokeStyle = "#ffb347";
  ctx.lineWidth = 3;
  ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

  ctx.fillStyle = "#ffb347";
  ctx.fillRect(ob.x + 5, ob.y + 7, ob.w - 10, 5);

  ctx.fillStyle = "#9c2414";
  ctx.fillRect(ob.x + 6, ob.y + 18, ob.w - 12, 4);
}

// ======================================
// DRAW GAME SCREEN
// ======================================

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!drawCover(backgroundImage)) {
    ctx.fillStyle = "#101722";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Ground
  ctx.fillStyle = "#ff4624";
  ctx.fillRect(0, ground, canvas.width, 4);

  ctx.fillStyle = "#303744";
  ctx.fillRect(0, ground + 4, canvas.width, canvas.height - ground);

  // Moving road markings
  ctx.fillStyle = "#ffb347";

  for (
    let x = -(frame * speed % 70);
    x < canvas.width;
    x += 70
  ) {
    ctx.fillRect(x, ground + 25, 35, 3);
  }

  // Game title
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("MULTANI RUNNER", 12, 25);

  // Obstacles
  obstacles.forEach(drawObstacle);

  // Character
  drawPlayer();
}

// ======================================
// HOME SCREEN
// ======================================

function drawHome() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!drawCover(homeImage)) {
    ctx.fillStyle = "#101722";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 35px Arial";
  ctx.fillText("MULTANI", 200, 190);
  ctx.fillText("RUNNER", 200, 235);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 17px Arial";
  ctx.fillText("TAP PLAY TO RUN", 200, 285);

  ctx.fillStyle = "#ff4624";
  ctx.fillRect(105, 325, 190, 58);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 23px Arial";
  ctx.fillText("PLAY", 200, 362);

  ctx.textAlign = "left";
}

// ======================================
// GAME OVER SCREEN
// ======================================

function drawOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!drawCover(homeImage)) {
    ctx.fillStyle = "#101722";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ff4624";
  ctx.font = "bold 34px Arial";
  ctx.fillText("GAME OVER", 200, 220);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 23px Arial";
  ctx.fillText("SCORE: " + score, 200, 270);

  ctx.fillStyle = "#ffb347";
  ctx.font = "bold 18px Arial";
  ctx.fillText("BEST: " + best, 200, 310);

  ctx.fillStyle = "#ff4624";
  ctx.fillRect(75, 355, 250, 52);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("PLAY AGAIN", 200, 388);

  ctx.fillStyle = "#303744";
  ctx.fillRect(120, 425, 160, 48);

  ctx.fillStyle = "#fff";
  ctx.fillText("HOME", 200, 456);

  ctx.textAlign = "left";
}

// ======================================
// DRAW CURRENT SCREEN
// ======================================

function drawScreen() {
  if (screen === "home") {
    drawHome();
  } else if (screen === "over") {
    drawOver();
  } else if (screen === "game") {
    drawGame();
  }
}

// ======================================
// START GAME
// ======================================

function startGame() {
  cancelAnimationFrame(animationId);

  score = 0;
  speed = 4;
  frame = 0;
  obstacles = [];

  player.y = ground - player.h;
  player.vy = 0;
  player.jumping = false;

  gameOver = false;
  running = true;
  screen = "game";
  lastTime = 0;

  scoreElement.textContent = "0";
  playBtn.textContent = "RESTART";

  stopSound(runSound);
  stopSound(crashSound);

  // Music starts after player taps PLAY.
  startMusic();

  messageElement.textContent = "Jump over the boxes!";

  drawScreen();

  animationId = requestAnimationFrame(loop);
}

// ======================================
// JUMP
// ======================================

function jump() {
  if (screen !== "game" || !running || gameOver) return;

  if (!player.jumping) {
    player.vy = -13;
    player.jumping = true;

    playSound(jumpSound);
  }
}

// ======================================
// GAME OVER
// ======================================

function endGame() {
  if (gameOver) return;

  gameOver = true;
  running = false;
  screen = "over";

  stopSound(runSound);
  stopSound(music);

  playSound(crashSound);

  if (score > best) {
    best = score;
    bestElement.textContent = best;

    try {
      localStorage.setItem("multaniRunnerBest", String(best));
    } catch (error) {}
  }

  playBtn.textContent = "PLAY AGAIN";
  messageElement.textContent = "Game over! Try again.";

  drawScreen();
}

// ======================================
// MAIN GAME LOOP
