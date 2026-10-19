const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 600;
canvas.id = "gameCanvas";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

document.querySelector("p").textContent =
"TAP TO JUMP • AVOID BOXES";

let player = {
x: 65,
y: 440,
w: 42,
h: 65,
vy: 0,
jumping: false
};

let obstacles = [];
let score = 0;
let best = Number(localStorage.getItem("multaniRunnerBest") || 0);
let speed = 4;
let running = false;
let gameOver = false;
let frame = 0;
let musicOn = false;
let audioCtx;

const ground = 510;

const info = document.createElement("div");
info.id = "gameInfo";
info.innerHTML = `

  <div>SCORE: <span id="score">0</span></div>
  <div>BEST: <span id="best">${best}</span></div>
  <button id="startBtn">START GAME</button>
  <button id="musicBtn">MUSIC: OFF</button>
`;
document.body.insertBefore(info, canvas);function sound(frequency = 500, duration = 0.12) {
try {
audioCtx = audioCtx || new AudioContext();
if (audioCtx.state === "suspended") audioCtx.resume();

const oscillator = audioCtx.createOscillator();
const gain = audioCtx.createGain();

oscillator.frequency.value = frequency;
oscillator.connect(gain);
gain.connect(audioCtx.destination);

gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(
  0.001,
  audioCtx.currentTime + duration
);

oscillator.start();
oscillator.stop(audioCtx.currentTime + duration);

} catch (e) {}
}

function startGame() {
score = 0;
speed = 4;
frame = 0;
obstacles = [];
player.y = ground - player.h;
player.vy = 0;
player.jumping = false;
gameOver = false;
running = true;
sound(700);
requestAnimationFrame(loop);
}

function jump() {
if (!running || gameOver) return;

if (!player.jumping) {
player.vy = -13;
player.jumping = true;
sound(600, 0.15);
}
}

function drawPlayer() {
// Temporary character; replace with your character image later.
ctx.fillStyle = "#ff4624";
ctx.fillRect(player.x, player.y, player.w, player.h);

ctx.fillStyle = "#151515";
ctx.fillRect(player.x + 5, player.y + 8, player.w - 10, 18);

ctx.fillStyle = "#00e5ff";
ctx.fillRect(player.x + 23, player.y + 14, 12, 5);

ctx.fillStyle = "#ffb36b";
ctx.fillRect(player.x + 7, player.y - 13, 29, 20);

ctx.fillStyle = "#111";
ctx.fillRect(player.x + 4, player.y + player.h - 7, 15, 9);
ctx.fillRect(player.x + 25, player.y + player.h - 7, 15, 9);
}

function drawObstacle(ob) {
ctx.fillStyle = "#ff4624";
ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

ctx.fillStyle = "#ffb347";
ctx.fillRect(ob.x + 5, ob.y + 7, ob.w - 10, 5);

ctx.strokeStyle = "#ffb347";
ctx.lineWidth = 2;
ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
}

function endGame() {
running = false;
gameOver = true;
sound(150, 0.5);

if (score > best) {
best = score;
localStorage.setItem("multaniRunnerBest", best);
document.getElementById("best").textContent = best;
}
}

function loop() {
if (!running) {
drawGameOver();
return;
}

frame++;
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Sky
ctx.fillStyle = "#101722";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Ground
ctx.fillStyle = "#ff4624";
ctx.fillRect(0, ground, canvas.width, 4);

ctx.fillStyle = "#303744";
ctx.fillRect(0, ground + 4, canvas.width, 90);

// Ground markings
ctx.fillStyle = "#ffb347";
for (let x = -(frame * speed % 70); x < canvas.width; x += 70) {
ctx.fillRect(x, ground + 24, 35, 3);
}

// Player physics
player.vy += 0.65;
player.y += player.vy;

if (player.y >= ground - player.h) {
player.y = ground - player.h;
player.vy = 0;
player.jumping = false;
}

// New obstacles
if (frame % 90 === 0) {
const h = 35 + Math.random() * 25;
obstacles.push({
x: canvas.width,
y: ground - h,
w: 28 + Math.random() * 12,
h: h
});
}

// Move obstacles
for (let i = obstacles.length - 1; i >= 0; i--) {
const ob = obstacles[i];
ob.x -= speed;
drawObstacle(ob);

if (
  player.x + 8 < ob.x + ob.w &&
  player.x + player.w - 8 > ob.x &&
  player.y + 8 < ob.y + ob.h &&
  player.y + player.h > ob.y
) {
  endGame();
  return;
}

if (ob.x + ob.w < 0) {
  obstacles.splice(i, 1);
  score++;
  speed = Math.min(8, 4 + score * 0.08);
  document.getElementById("score").textContent = score;
}

}

drawPlayer();

ctx.fillStyle = "white";
ctx.font = "14px Arial";
ctx.fillText("MULTANI RUNNER", 12, 25);

requestAnimationFrame(loop);
}

function drawGameOver() {
ctx.fillStyle = "#101722";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "#ff4624";
ctx.font = "bold 32px Arial";
ctx.textAlign = "center";
ctx.fillText("GAME OVER", 200, 250);

ctx.fillStyle = "white";
ctx.font = "20px Arial";
ctx.fillText("Score: " + score, 200, 295);
ctx.fillText("Best: " + best, 200, 330);
ctx.font = "15px Arial";
ctx.fillText("Press START GAME to try again", 200, 375);
ctx.textAlign = "left";
}

canvas.addEventListener("pointerdown", jump);

document.getElementById("startBtn").addEventListener("click", () => {
startGame();
});

document.getElementById("musicBtn").addEventListener("click", () => {
musicOn = !musicOn;
document.getElementById("musicBtn").textContent =
"MUSIC: " + (musicOn ? "ON" : "OFF");

// Temporary sound test. Real background music will be added later.
if (musicOn) sound(440, 0.3);
});

drawGameOver();
