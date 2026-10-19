// ============================================
// MULTANI RUNNER - COMPLETE FIXED GAME
// ============================================

const container = document.getElementById("game-container");

if (!container) {
  document.body.innerHTML =
    '<p style="color:white">Game container nahi mila.</p>';
} else {

  // ---------- ASSET LINKS ----------

  const HOME_IMAGE =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/1792389240189.jpg";

  const GAME_BACKGROUND =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/1792388836123.jpg";

  const MUSIC_URL =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Background_Music___Saraiki_Song_2024___No_Copyright_Song___Mushtaq_Khanukhel(256k).mp3";

  const RUN_URL =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Goofy_Running_Sound_Effect(48k).mp3";

  const JUMP_URL =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Jumping___Sound_Effect__Copyright_Free_(48k).mp3";

  const CRASH_URL =
    "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/Sparrow_Ouch_Meme_Effect(48k).mp3";

  // ---------- GAME UI ----------

  const style = document.createElement("style");

  style.textContent = `
    #multaniGame {
      position: relative;
      width: 100%;
      max-width: 430px;
      margin: 0 auto;
      padding: 10px;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }

    #multaniGame * {
      box-sizing: border-box;
    }

    #mgTop {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    #mgTitle {
      color: #ff4624;
      font-size: 23px;
      font-weight: 900;
      text-shadow: 0 0 10px #ff4624;
    }

    #mgMusic {
      border: 1px solid #ffb347;
      border-radius: 9px;
      padding: 10px;
      background: #171c27;
      color: white;
      font-weight: bold;
      cursor: pointer;
      min-width: 94px;
    }

    #mgCanvas {
      display: block;
      width: 100%;
      height: auto;
      border: 2px solid #ff4624;
      border-radius: 12px;
      background: #101722;
      touch-action: manipulation;
    }

    #mgStats {
      display: flex;
      justify-content: space-around;
      padding: 10px 0;
      color: #ffb347;
      font-weight: bold;
    }

    #mgControls {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }

    .mgButton {
      border: none;
      border-radius: 10px;
      padding: 13px 22px;
      min-height: 46px;
      background: #ff4624;
      color: white;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      touch-action: manipulation;
    }

    .mgButton:active {
      transform: scale(.97);
    }

    #mgJump {
      background: #00a9c7;
      min-width: 150px;
      font-size: 20px;
    }

    #mgHome {
      background: #303744;
    }

    #mgMessage {
      color: #b9c3d5;
      font-size: 12px;
      overflow-wrap: anywhere;
      margin-top: 10px;
    }

    #mgJump[hidden],
    #mgPlay[hidden],
    #mgHome[hidden] {
      display: none !important;
    }
  `;

  document.head.appendChild(style);

  container.innerHTML = `
    <div id="multaniGame">

      <div id="mgTop">
        <div id="mgTitle">MULTANI RUNNER</div>
        <button id="mgMusic" type="button">🎵 MUSIC ON</button>
      </div>

      <div id="mgStats">
        <span>SCORE: <span id="mgScore">0</span></span>
        <span>BEST: <span id="mgBest">0</span></span>
      </div>

      <canvas id="mgCanvas" width="400" height="600"></canvas>

      <div id="mgControls">
        <button id="mgPlay" class="mgButton" type="button">
          PLAY
        </button>

        <button id="mgJump" class="mgButton" type="button" hidden>
          JUMP ⬆
        </button>

        <button id="mgHome" class="mgButton" type="button" hidden>
          HOME
        </button>
      </div>

      <div id="mgMessage">PLAY dabakar game shuru karein.</div>

    </div>
  `;

  // ---------- ELEMENTS ----------

  const canvas = document.getElementById("mgCanvas");
  const ctx = canvas.getContext("2d");

  const playBtn = document.getElementById("mgPlay");
  const jumpBtn = document.getElementById("mgJump");
  const homeBtn = document.getElementById("mgHome");
  const musicBtn = document.getElementById("mgMusic");

  const scoreText = document.getElementById("mgScore");
  const bestText = document.getElementById("mgBest");
  const message = document.getElementById("mgMessage");

  // ---------- IMAGES ----------

  const homeImg = new Image();
  homeImg.src = HOME_IMAGE;

  const bgImg = new Image();
  bgImg.src = GAME_BACKGROUND;

  // ---------- AUDIO ----------

  const music = new Audio(MUSIC_URL);
  music.loop = true;
  music.volume = 0.35;
  music.preload = "auto";

  const runSound = new Audio(RUN_URL);
  runSound.loop = true;
  runSound.volume = 0.5;
  runSound.preload = "auto";

  const jumpSound = new Audio(JUMP_URL);
  jumpSound.volume = 0.8;

  const crashSound = new Audio(CRASH_URL);
  crashSound.volume = 1;

  let musicEnabled = true;

  function playAudio(audio, restart = true) {
    try {
      if (restart) audio.currentTime = 0;

      const result = audio.play();

      if (result && result.catch) {
        result.catch(error => {
          console.log("Audio play issue:", error);
        });
      }
    } catch (error) {
      console.log("Audio error:", error);
    }
  }

  function stopAudio(audio) {
    audio.pause();

    try {
      audio.currentTime = 0;
    } catch (error) {}
  }

  function stopAllGameSounds() {
    stopAudio(runSound);
    stopAudio(music);
  }

  // ---------- GAME STATE ----------

  const ground = 510;

  let screen = "home";
  let running = false;
  let gameOver = false;
  let frame = 0;
  let score = 0;
  let speed = 4;
  let obstacles = [];
  let animationId = 0;
  let lastTime = 0;

  let best = 0;

  try {
    best = Number(
      localStorage.getItem("multaniRunnerBest") || 0
    );
  } catch (error) {}

  bestText.textContent = best;

  const player = {
    x: 62,
    y: ground - 65,
    w: 42,
    h: 65,
    vy: 0,
    jumping: false
  };

  // ---------- IMAGE DRAWING ----------

  function drawCover(img) {
    if (!img.complete || !img.naturalWidth) {
      return false;
    }

    const scale = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight
    );

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    ctx.drawImage(
      img,
      (canvas.width - w) / 2,
      (canvas.height - h) / 2,
      w,
      h
    );

    return true;
  }

  // ---------- HOME SCREEN ----------

  function drawHome() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!drawCover(homeImg)) {
      ctx.fillStyle = "#101722";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff4624";
    ctx.font = "bold 36px Arial";
    ctx.fillText("MULTANI", 200, 210);
    ctx.fillText("RUNNER", 200, 255);

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.fillText("READY TO RUN?", 200, 300);

    ctx.textAlign = "left";
  }

  // ---------- PLAYER ----------

  function drawPlayer() {
    const x = player.x;
    const y = player.y;

    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(x + 21, ground + 2, 25, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const legMove = running && !player.jumping
      ? Math.sin(frame * 0.35) * 6
      : 0;

    ctx.fillStyle = "#151515";
    ctx.fillRect(x + 5, y + 47, 13, 17 + legMove);
    ctx.fillRect(x + 25, y + 47, 13, 17 - legMove);

    ctx.fillStyle = "#ffb347";
    ctx.fillRect(x + 1, y + 59 + legMove, 20, 6);
    ctx.fillRect(x + 22, y + 59 - legMove, 20, 6);

    ctx.fillStyle = "#ff4624";
    ctx.fillRect(x + 3, y + 21, 36, 31);

    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(x + 18, y + 24, 6, 25);

    ctx.fillStyle = "#ffb36b";
    ctx.fillRect(x - 1, y + 24, 8, 25);
    ctx.fillRect(x + 35, y + 24, 8, 25);

    ctx.fillStyle = "#ffb36b";
    ctx.fillRect(x + 8, y, 28, 25);

    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 6, y - 4, 32, 9);

    ctx.fillStyle = "#111";
    ctx.fillRect(x + 27, y + 9, 4, 4);
  }

  // ---------- BOXES ----------

  function drawObstacle(ob) {
    ctx.fillStyle = "#ff4624";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

    ctx.strokeStyle = "#ffb347";
    ctx.lineWidth = 3;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

    ctx.fillStyle = "#ffb347";
    ctx.fillRect(ob.x + 5, ob.y + 7, ob.w - 10, 5);
  }

  // ---------- GAME SCREEN ----------

  function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!drawCover(bgImg)) {
      ctx.fillStyle = "#101722";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "#ff4624";
    ctx.fillRect(0, ground, canvas.width, 4);

    ctx.fillStyle = "#303744";
    ctx.fillRect(0, ground + 4, canvas.width, 90);

    ctx.fillStyle = "#ffb347";

    for (
      let x = -(frame * speed % 70);
      x < canvas.width;
      x += 70
    ) {
      ctx.fillRect(x, ground + 25, 35, 3);
    }

    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("MULTANI RUNNER", 12, 25);

    obstacles.forEach(drawObstacle);
    drawPlayer();
  }

  // ---------- GAME OVER ----------

  function drawOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!drawCover(homeImg)) {
      ctx.fillStyle = "#101722";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(0,0,0,.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff4624";
    ctx.font = "bold 34px Arial";
    ctx.fillText("GAME OVER", 200, 240);

    ctx.fillStyle = "white";
    ctx.font = "bold 23px Arial";
    ctx.fillText("SCORE: " + score, 200, 290);

    ctx.fillStyle = "#ffb347";
    ctx.font = "bold 19px Arial";
    ctx.fillText("BEST: " + best, 200, 330);

    ctx.textAlign = "left";
  }

  // ---------- SCREEN SWITCHING ----------

  function showScreen(nextScreen) {
    screen = nextScreen;

    playBtn.hidden = nextScreen !== "home" &&
                     nextScreen !== "over";

    jumpBtn.hidden = nextScreen !== "game";

    homeBtn.hidden = nextScreen !== "over";

    if (nextScreen === "home") {
      playBtn.textContent = "PLAY";
      message.textContent = "PLAY dabakar game shuru karein.";
      drawHome();
    }

    if (nextScreen === "game") {
      message.textContent = "Boxes se bachne ke liye JUMP dabayein.";
      drawGame();
    }

    if (nextScreen === "over") {
      playBtn.textContent = "PLAY AGAIN";
      message.textContent = "Game khatam! Dobara try karein.";
      drawOver();
    }
  }

  // ---------- START GAME ----------

  function startGame() {
    cancelAnimationFrame(animationId);

    score = 0;
    speed = 4;
    frame = 0;
    obstacles = [];

    player.y = ground - player.h;
    player.vy = 0;
    player.jumping = false;

    running = true;
    gameOver = false;
    lastTime = 0;

    scoreText.textContent = "0";

    stopAudio(runSound);
    stopAudio(crashSound);

    showScreen("game");

    if (musicEnabled) {
      playAudio(music, false);
    }

    animationId = requestAnimationFrame(loop);
  }

  // ---------- JUMP ----------

  function jump() {
    if (screen !== "game" || !running || gameOver) {
      return;
    }

    if (!player.jumping) {
      player.vy = -13;
      player.jumping = true;
      playAudio(jumpSound);
    }
  }

  // ---------- END GAME ----------

  function endGame() {
    if (gameOver) return;

    gameOver = true;
    running = false;

    cancelAnimationFrame(animationId);

    stopAudio(runSound);
    stopAudio(music);

    playAudio(crashSound);

    if (score > best) {
      best = score;
      bestText.textContent = String(best);

      try {
        localStorage.setItem(
          "multaniRunnerBest",
          String(best)
        );
      } catch (error) {}
    }

    showScreen("over");
  }

  // ---------- MAIN GAME LOOP ----------

  function loop(timestamp) {
    if (!running || screen !== "game") return;

    if (!lastTime) lastTime = timestamp;

    const delta = Math.min(
      (timestamp - lastTime) / 16.67,
      2
    );

    lastTime = timestamp;
    frame += delta;

    player.vy += 0.65 * delta;
    player.y += player.vy * delta;

    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.jumping = false;
    }

    // Create boxes at regular intervals.
    if (frame % 90 < delta) {
      const h = 35 + Math.random() * 25;

      obstacles.push({
        x: canvas.width,
        y: ground - h,
        w: 28 + Math.random() * 12,
        h: h,
        passed: false
      });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];

      ob.x -= speed * delta;

      const hit =
        player.x + 8 < ob.x + ob.w &&
        player.x + player.w - 8 > ob.x &&
        player.y + 8 < ob.y + ob.h &&
        player.y + player.h > ob.y;

      if (hit) {
        endGame();
        return;
      }

      if (!ob.passed && ob.x + ob.w < player.x) {
        ob.passed = true;
        score++;

        speed = Math.min(8, 4 + score * 0.08);
        scoreText.textContent = String(score);
      }

      if (ob.x + ob.w < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Running sound plays only while on the ground.
    if (!player.jumping && running) {
      if (runSound.paused) {
        playAudio(runSound, false);
      }
    } else if (!runSound.paused) {
      stopAudio(runSound);
    }

    drawGame();

    animationId = requestAnimationFrame(loop);
  }

  // ---------- BUTTON EVENTS ----------

  playBtn.addEventListener("click", startGame);

  jumpBtn.addEventListener("click", jump);

  homeBtn.addEventListener("click", () => {
    cancelAnimationFrame(animationId);

    running = false;
    gameOver = false;

    stopAllGameSounds();
    stopAudio(crashSound);

    showScreen("home");
  });

  musicBtn.addEventListener("click", () => {
    musicEnabled = !musicEnabled;

    musicBtn.textContent = musicEnabled
      ? "🎵 MUSIC ON"
      : "🔇 MUSIC OFF";

    if (!musicEnabled) {
      stopAudio(music);
    } else if (screen === "game") {
      playAudio(music, false);
    }
  });

  // Tap the game screen to jump.
  canvas.addEventListener("pointerdown", () => {
    if (screen === "game") {
      jump();
    }
  });

  // ---------- INITIAL SCREEN ----------

  homeImg.onload = () => {
    if (screen === "home") drawHome();
    if (screen === "over") drawOver();
  };

  bgImg.onload = () => {
    if (screen === "game") drawGame();
  };

  homeImg.onerror = () => {
    message.textContent = "Home photo load nahi hui.";
  };

  bgImg.onerror = () => {
    message.textContent = "Game background photo load nahi hui.";
  };

  musicBtn.textContent = "🎵 MUSIC ON";

  showScreen("home");
      }
