let duration = 24 * 60 * 60; // Start with 24 hours (in seconds)
const timerElement = document.getElementById("timer");

function updateTimerDisplay() {
  const hours = String(Math.floor(duration / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, '0');
  const seconds = String(duration % 60).padStart(2, '0');
  timerElement.textContent = `${hours}:${minutes}:${seconds}`;
}

function tick() {
  if (duration > 0) {
    duration--;
    updateTimerDisplay();
  }
}

updateTimerDisplay();
setInterval(tick, 1000);
