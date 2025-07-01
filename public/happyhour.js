const timerDiv = document.getElementById('happyhour-timer');
const ws = new WebSocket(`ws://${window.location.host}`);

function formatCountdown(seconds) {
  if (seconds <= 0) return "Happy Hour Ready!";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `Time till Happy Hour: ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === 'happyHourDuration') {
    timerDiv.textContent = formatCountdown(data.amount);
    if (data.amount <= 0) {
      timerDiv.textContent = "It's Happy Hour! All time added is doubled!";
      timerDiv.classList.add('happyhour-ready');
    } else {
      timerDiv.classList.remove('happyhour-ready');
    }
  }
};

// Optional: Style the div on first load
timerDiv.textContent = "Time till Happy Hour: --:--:--";
