const ws = new WebSocket(`ws://${window.location.host}`);

//TIMER CONTROL BUTTONS
document.getElementById('startBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'start' }));
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'pause' }));
});

document.getElementById('add1minBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'add', amount: 60 }));
});

document.getElementById('add5minBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'add', amount: 300 }));
});

document.getElementById('sub1minBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'subtract', amount: 60 }));
});

document.getElementById('addCustomBtn').addEventListener('click', () => {
  const amount = parseInt(document.getElementById('customAmount').value);
  if (!isNaN(amount) && amount > 0) {
    ws.send(JSON.stringify({ type: 'add', amount }));
  }
});

document.getElementById('subCustomBtn').addEventListener('click', () => {
  const amount = parseInt(document.getElementById('customAmount').value);
  if (!isNaN(amount) && amount > 0) {
    ws.send(JSON.stringify({ type: 'subtract', amount }));
  }
});

document.getElementById('set-timer-btn').addEventListener('click', () => {
  const hours = parseInt(document.getElementById('set-hours').value) || 0;
  const minutes = parseInt(document.getElementById('set-minutes').value) || 0;

  const totalSeconds = (hours * 3600) + (minutes * 60);

  if (totalSeconds < 0 || isNaN(totalSeconds)) {
    alert("Please enter a valid time.");
    return;
  }

  ws.send(JSON.stringify({ type: 'set', amount: totalSeconds }));
  alert(`Timer manually set to ${hours}h ${minutes}m`);
});


//LOADING PROBABILITES
let loadedProbabilities = null;

fetch('/config/probabilities.json')
  .then(res => res.json())
  .then(data => {
    loadedProbabilities = data;
    console.log("Loaded probability config:", loadedProbabilities);
  })
  .catch(err => {
    console.error("Failed to load probabilities:", err);
  });

function getProbabilityTier(amount) {
  if (amount >= 200) return loadedProbabilities.twohundredDonation;
  if (amount >= 100) return loadedProbabilities.hundredDonation;
  if (amount >= 50) return loadedProbabilities.fiftyDonation;
  return loadedProbabilities.default;
}

function getRandomMultiplier(amount) {
  if (!loadedProbabilities) return 1;
  const probSet = getProbabilityTier(amount);
  const rand = Math.random();
  let sum = 0;
  for (const [key, weight] of Object.entries(probSet)) {
    sum += weight;
    if (rand <= sum) {
      return key === "💣" ? "💣" : parseInt(key);
    }
  }
  return 1;
}

//MANUAL DONATION LOGIC
function applyDonation(name, amount) {
  const multiplier = getRandomMultiplier(amount);

  if (multiplier === "💣") {
    // Add 1 hour
    ws.send(JSON.stringify({ type: 'add', amount: 3600 }));
    alert(`💣 ${name} hit a bomb! +1 hour added. Rolling again...`);

    // Retry the donation
    setTimeout(() => applyDonation(name, amount), 500);
    return;
  }

  const totalSeconds = Math.floor(amount * multiplier) * 60;
  ws.send(JSON.stringify({ type: 'add', amount: totalSeconds }));
  alert(`${name} donated $${amount} → ${multiplier}x → +${Math.floor(totalSeconds / 60)} minutes`);
}

document.getElementById('manual-submit').addEventListener('click', () => {
  const name = document.getElementById('manual-name').value.trim();
  const amount = parseFloat(document.getElementById('manual-amount').value);

  if (!name || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid name and donation amount.");
    return;
  }

  applyDonation(name, amount);
});

