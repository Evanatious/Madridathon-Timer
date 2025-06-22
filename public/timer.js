const timerElement = document.getElementById('timer');
let duration = 24 * 60 * 60; //24 hours

function formatTime(sec) {
  const hours = String(Math.floor(sec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const seconds = String(sec % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'update') {
    duration = data.duration;
    timerElement.textContent = formatTime(duration);
  }
};
