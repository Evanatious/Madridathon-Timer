const timerElement = document.getElementById('timer');
let duration = 24 * 60 * 60; //24 hours

function formatTime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let mm = minutes.toString().padStart(2, '0');
  let ss = secs.toString().padStart(2, '0');
  let hh = hours.toString();

  if (days > 0) {
    hh = hours.toString().padStart(2, '0');
    return `${days}:${hh}:${mm}:${ss}`;
  } else if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  } else {
    return `${minutes}:${ss}`;
  }
}


const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
  // Register this connection as a timer display
  ws.send(JSON.stringify({ type: 'registerTimer' }));
  console.log('Timer registered with server');
};

ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'update') {
    duration = data.duration;
    timerElement.textContent = formatTime(duration);
  } else if (data.type === 'spinWheel') {
    if (Array.isArray(data.rolls)) {
      await window.animateWheelSequenceWithTimerUpdate(
        data.rolls,
        data.donorName,
        data.donationAmount,
        ws,
        data.donationType
      );
    }
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

// Optional helper for "popup" effect below the timer
function showPopup(message) {
  let popup = document.getElementById('timer-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'timer-popup';
    popup.style.position = 'absolute';
    popup.style.top = '60%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, 0)';
    popup.style.background = '#222';
    popup.style.color = '#0f0';
    popup.style.fontSize = '2em';
    popup.style.padding = '16px 40px';
    popup.style.borderRadius = '18px';
    popup.style.zIndex = 9999;
    popup.style.boxShadow = '0 4px 32px #0009';
    popup.style.textAlign = 'center';
    popup.style.opacity = '0';
    document.body.appendChild(popup);
  }
  popup.textContent = message;
  popup.style.opacity = '1';
  setTimeout(() => { popup.style.opacity = '0'; }, 2600);
}