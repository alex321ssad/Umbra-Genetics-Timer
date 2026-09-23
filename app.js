
const $ = (id) => document.getElementById(id);

const audio = {
  key1: $("key1"),
  key2: $("key2"),
  beep: $("beep"),
  intro: $("intro"),
  outro: $("outro"),
  complete: $("complete")
};

let mode = "countdown";
let running = false;
let timerId = null;

let totalSeconds = 300;
let remaining = 300;
let elapsed = 0;

let alarmTarget = "";
let alarmTriggered = false;


/* =========================
   AUDIO
   ========================= */

function play(sound) {
  if (!sound) return;

  try {
    sound.pause();
    sound.currentTime = 0;

    const promise = sound.play();

    if (promise !== undefined) {
      promise.catch((error) => {
        console.warn("Audio playback failed:", error);
      });
    }
  } catch (error) {
    console.warn("Audio error:", error);
  }
}


/* =========================
   COMPLETE SOUND
   ========================= */

function playComplete() {
  console.log("COMPLETE SOUND TRIGGERED");

  if (!audio.complete) {
    console.warn("Complete audio element not found.");
    return;
  }

  try {
    audio.complete.pause();
    audio.complete.currentTime = 0;

    const promise = audio.complete.play();

    if (promise !== undefined) {
      promise
        .then(() => {
          console.log("COMPLETE SOUND PLAYING");
        })
        .catch((error) => {
          console.error("COMPLETE SOUND FAILED:", error);
        });
    }
  } catch (error) {
    console.error("COMPLETE SOUND ERROR:", error);
  }
}


/* =========================
   DISPLAY
   ========================= */

function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}


function updateDisplay() {
  if (mode === "countdown") {
    $("timerDisplay").textContent = formatTime(remaining);
  } else if (mode === "timer") {
    $("timerDisplay").textContent = formatTime(elapsed);
  } else if (mode === "alarm") {
    $("timerDisplay").textContent = alarmTarget || "--:--";
  }
}


/* =========================
   STATUS / LOG
   ========================= */

function setStatus(text) {
  $("status").textContent = text;
}


function log(text) {
  const line = document.createElement("div");

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  line.textContent = `[${time}] ${text}`;

  $("log").prepend(line);
}


/* =========================
   TIMER LOOP
   ========================= */

function stopLoop() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}


function startLoop() {
  stopLoop();

  timerId = setInterval(() => {
    tick();
  }, 1000);
}


function tick() {

  if (mode === "countdown") {

    if (remaining > 0) {
      remaining--;
      updateDisplay();

      if (remaining <= 3 && remaining > 0) {
        play(audio.beep);
      }

      return;
    }

    completeCountdown();
    return;
  }


  if (mode === "timer") {
    elapsed++;
    updateDisplay();
    return;
  }


  if (mode === "alarm") {
    checkAlarm();
  }
}


/* =========================
   COUNTDOWN COMPLETE
   ========================= */

function completeCountdown() {

  remaining = 0;
  running = false;

  stopLoop();

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  updateDisplay();

  setStatus("COUNTDOWN COMPLETE");
  log("COUNTDOWN COMPLETE");

  document.body.classList.add("alert");

  playComplete();


  setTimeout(() => {
    setStatus("SELF-DESTRUCTION SEQUENCE ACTIVE...");
    log("SELF-DESTRUCTION SEQUENCE ACTIVE...");
  }, 900);


  setTimeout(() => {
    setStatus("SELF-DESTRUCTION SEQUENCE COMPLETE");
    log("SELF-DESTRUCTION SEQUENCE COMPLETE");

    document.body.classList.remove("alert");
  }, 2700);
}


/* =========================
   ALARM
   ========================= */

function checkAlarm() {

  if (!alarmTarget) return;

  const now = new Date();

  const current =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  if (current === alarmTarget && !alarmTriggered) {

    alarmTriggered = true;
    running = false;

    stopLoop();

    $("startBtn").disabled = false;
    $("pauseBtn").disabled = true;

    setStatus("ALARM TRIGGERED");
    log("ALARM TRIGGERED");

    document.body.classList.add("alert");

    playComplete();

    setTimeout(() => {
      document.body.classList.remove("alert");
    }, 3000);
  }
}


/* =========================
   INITIALIZE
   ========================= */

$("initializeBtn").addEventListener("click", () => {

  play(audio.intro);

  $("bootScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  log("TERMINAL INITIALIZED");
  setStatus("SYSTEM READY");

  updateDisplay();
});


/* =========================
   MODE BUTTONS
   ========================= */

$("countdownMode").addEventListener("click", () => {

  mode = "countdown";

  stopLoop();
  running = false;

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  setStatus("COUNTDOWN MODE");
  log("MODE: COUNTDOWN");

  updateDisplay();
});


$("timerMode").addEventListener("click", () => {

  mode = "timer";

  stopLoop();
  running = false;

  elapsed = 0;

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  setStatus("TIMER MODE");
  log("MODE: TIMER");

  updateDisplay();
});


$("alarmMode").addEventListener("click", () => {

  mode = "alarm";

  stopLoop();
  running = false;

  alarmTriggered = false;

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  setStatus("ALARM MODE");
  log("MODE: ALARM");

  updateDisplay();
});


/* =========================
   START
   ========================= */

$("startBtn").addEventListener("click", () => {

  if (running) return;

  if (mode === "countdown" && remaining <= 0) {
    remaining = totalSeconds;
  }

  running = true;

  $("startBtn").disabled = true;
  $("pauseBtn").disabled = false;

  setStatus("SEQUENCE ACTIVE");

  log("SEQUENCE STARTED");

  play(audio.key1);

  startLoop();
});


/* =========================
   PAUSE
   ========================= */

$("pauseBtn").addEventListener("click", () => {

  if (!running) return;

  running = false;

  stopLoop();

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  setStatus("SEQUENCE PAUSED");
  log("SEQUENCE PAUSED");

  play(audio.key2);
});


/* =========================
   RESET
   ========================= */

$("resetBtn").addEventListener("click", () => {

  stopLoop();

  running = false;

  remaining = totalSeconds;
  elapsed = 0;

  alarmTriggered = false;

  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;

  document.body.classList.remove("alert");

  setStatus("SYSTEM READY");
  log("SEQUENCE RESET");

  updateDisplay();
});


/* =========================
   COUNTDOWN INPUT
   ========================= */

if ($("minutesInput")) {

  $("minutesInput").addEventListener("change", () => {

    const value = parseInt($("minutesInput").value, 10);

    if (!Number.isNaN(value) && value >= 0) {

      totalSeconds = value * 60;
      remaining = totalSeconds;

      updateDisplay();
    }
  });
}


/* =========================
   ALARM INPUT
   ========================= */

if ($("alarmInput")) {

  $("alarmInput").addEventListener("change", () => {

    alarmTarget = $("alarmInput").value;
    alarmTriggered = false;

    updateDisplay();
  });
}


/* =========================
   SHUTDOWN
   ========================= */

$("shutdownBtn").addEventListener("click", () => {

  stopLoop();

  running = false;

  play(audio.outro);

  $("appScreen").classList.add("hidden");
  $("bootScreen").classList.remove("hidden");

  document.querySelector(".boot-status").textContent =
    "SYSTEM STANDBY";
});


/* =========================
   INITIAL STATE
   ========================= */

$("pauseBtn").disabled = true;

updateDisplay();

console.log("UMBRA GENETICS TERMINAL READY");
console.log("Complete audio:", audio.complete);

