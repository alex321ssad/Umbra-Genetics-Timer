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

function play(sound) {
if (!sound) return;

try {
sound.pause();
sound.currentTime = 0;

```
const promise = sound.play();

if (promise !== undefined) {
  promise.catch((err) => {
    console.warn("Audio playback failed:", err);
  });
}
```

} catch (err) {
console.warn("Audio error:", err);
}
}

function log(message) {
const line = document.createElement("div");
line.className = "log-entry";

const now = new Date().toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
second: "2-digit"
});

line.textContent = `[${now}] ${message}`;
$("log").prepend(line);

while ($("log").children.length > 4) {
$("log").lastChild.remove();
}
}

function pad(n) {
return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatCountdown(seconds) {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = seconds % 60;

return h > 0
? `${pad(h)}:${pad(m)}:${pad(s)}`
: `${pad(m)}:${pad(s)}`;
}

function formatStopwatch(seconds) {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = seconds % 60;

return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateDisplay() {
if (mode === "countdown") {
$("display").textContent = formatCountdown(remaining);

```
const pct = totalSeconds
  ? ((totalSeconds - remaining) / totalSeconds) * 100
  : 0;

$("progressBar").style.width =
  `${Math.min(100, Math.max(0, pct))}%`;
```

} else if (mode === "timer") {
$("display").textContent = formatStopwatch(elapsed);
$("progressBar").style.width = "100%";

} else {
$("display").textContent = alarmTarget || "--:--";
$("progressBar").style.width = "0%";
}
}

function setStatus(text) {
$("statusLine").textContent = text;
}

function syncInputs() {
$("minutes").value = Math.floor(totalSeconds / 60);
$("seconds").value = totalSeconds % 60;
}

function readCountdown() {
const m = Math.max(
0,
Math.min(999, parseInt($("minutes").value || 0, 10))
);

const s = Math.max(
0,
Math.min(59, parseInt($("seconds").value || 0, 10))
);

totalSeconds = m * 60 + s;
remaining = totalSeconds;

updateDisplay();
}

function stopLoop() {
if (timerId) clearInterval(timerId);
timerId = null;
}

function startLoop() {
if (running) return;

running = true;

$("startBtn").disabled = true;
$("pauseBtn").disabled = false;

if (mode === "countdown") {

```
if (remaining <= 0) readCountdown();

if (remaining <= 0) {
  setStatus("NO TIME CONFIGURED");
  running = false;
  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;
  return;
}

setStatus("COUNTDOWN ACTIVE");
log("COUNTDOWN ACTIVE");
```

} else if (mode === "timer") {

```
setStatus("TIMER ACTIVE");
log("STOPWATCH ACTIVE");
```

} else {

```
if (!alarmTarget) {
  setStatus("SELECT TARGET TIME");
  running = false;
  $("startBtn").disabled = false;
  $("pauseBtn").disabled = true;
  return;
}

setStatus("ALARM ARMED");
log(`ALARM ARMED FOR ${alarmTarget}`);
```

}

play(audio.key2);

timerId = setInterval(() => {

```
if (mode === "countdown") {
  remaining--;
  updateDisplay();

  if (remaining <= 0) {
    completeCountdown();
  }

} else if (mode === "timer") {
  elapsed++;
  updateDisplay();

} else {
  checkAlarm();
}
```

}, 1000);
}

function pauseLoop() {
if (!running) return;

running = false;
stopLoop();

$("startBtn").disabled = false;
$("pauseBtn").disabled = true;

setStatus(
mode === "alarm"
? "ALARM PAUSED"
: "SYSTEM PAUSED"
);

log("PROCESS PAUSED");
play(audio.key1);
}

function reset() {
running = false;
stopLoop();

$("startBtn").disabled = false;
$("pauseBtn").disabled = true;

document.body.classList.remove("alert");
alarmTriggered = false;

if (mode === "countdown") {
readCountdown();
setStatus("SYSTEM READY");

} else if (mode === "timer") {
elapsed = 0;
updateDisplay();
setStatus("SYSTEM READY");

} else {
alarmTarget = "";
$("alarmTime").value = "";
updateDisplay();
setStatus("SYSTEM READY");
}

log("SYSTEM RESET");
play(audio.key1);
}

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

// TIMER COMPLETE SOUND
play(audio.complete);

// The dramatic joke — harmless, entirely local,
// no actual destructive action.
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

function checkAlarm() {
const now = new Date();
const current =
`${pad(now.getHours())}:${pad(now.getMinutes())}`;

if (current === alarmTarget && !alarmTriggered) {

```
alarmTriggered = true;
running = false;
stopLoop();

$("startBtn").disabled = false;
$("pauseBtn").disabled = true;

setStatus("ALARM TRIGGERED");
log("ALARM TRIGGERED");

document.body.classList.add("alert");

play(audio.complete);

setTimeout(() => {
  document.body.classList.remove("alert");
}, 5000);
```

}
}

function switchMode(newMode) {
if (newMode === mode) return;

running = false;
stopLoop();

mode = newMode;

$("startBtn").disabled = false;
$("pauseBtn").disabled = true;

document.body.classList.remove("alert");

document.querySelectorAll(".mode").forEach(btn => {
btn.classList.toggle(
"active",
btn.dataset.mode === mode
);
});

$("countdownControls").classList.toggle(
"hidden",
mode !== "countdown"
);

$("timerControls").classList.toggle(
"hidden",
mode !== "timer"
);

$("alarmControls").classList.toggle(
"hidden",
mode !== "alarm"
);

$("modeLabel").textContent = mode.toUpperCase();

if (mode === "countdown") {
syncInputs();
readCountdown();

} else if (mode === "timer") {
elapsed = 0;
updateDisplay();

} else {
alarmTarget = "";
$("alarmTime").value = "";
updateDisplay();
}

setStatus("SYSTEM READY");
log(`MODE SELECTED: ${mode.toUpperCase()}`);

play(audio.key1);
}

$("initializeBtn").addEventListener("click", () => {
play(audio.intro);

$("bootScreen").classList.add("hidden");
$("appScreen").classList.remove("hidden");

log("TERMINAL INITIALIZED");
setStatus("SYSTEM READY");
});

$("shutdownBtn").addEventListener("click", () => {
stopLoop();
running = false;

play(audio.outro);

$("appScreen").classList.add("hidden");
$("bootScreen").classList.remove("hidden");

$("boot-status");

document.querySelector(".boot-status").textContent =
"SYSTEM STANDBY";
});

$("startBtn").addEventListener("click", startLoop);
$("pauseBtn").addEventListener("click", pauseLoop);
$("resetBtn").addEventListener("click", reset);

$("minutes").addEventListener("input", () => {
if (!running && mode === "countdown") {
readCountdown();
}

play(audio.key1);
});

$("seconds").addEventListener("input", () => {
if (!running && mode === "countdown") {
readCountdown();
}

play(audio.key1);
});

document.querySelectorAll(".presets button").forEach(btn => {
btn.addEventListener("click", () => {

```
$("minutes").value = btn.dataset.min;
$("seconds").value = 0;

if (mode !== "countdown") {
  switchMode("countdown");
}

readCountdown();

setStatus("PRESET LOADED");
log(`PRESET LOADED: ${btn.textContent}`);

play(audio.key2);
```

});
});

document.querySelectorAll(".mode").forEach(btn => {
btn.addEventListener("click", () => {
switchMode(btn.dataset.mode);
});
});

$("alarmTime").addEventListener("change", () => {
alarmTarget = $("alarmTime").value;
alarmTriggered = false;

updateDisplay();

if (alarmTarget) {
setStatus("TARGET TIME SET");
log(`TARGET TIME SET: ${alarmTarget}`);
play(audio.beep);
}
});

setInterval(() => {
const now = new Date();

$("clock").textContent =
now.toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
second: "2-digit"
});

if (mode === "alarm" && running) {
checkAlarm();
}

}, 250);

readCountdown();

$("clock").textContent =
new Date().toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
second: "2-digit"
});
