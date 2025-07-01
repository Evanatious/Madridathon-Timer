const ws = new WebSocket(`ws://${window.location.host}`);

const happyHourToggle = document.getElementById('happy-hour-toggle');
happyHourToggle.addEventListener('change', () => {
  ws.send(JSON.stringify({
    type: 'setDoubler',
    enabled: happyHourToggle.checked
  }));
});

let happyHourDurationInterval = null;


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

// MANUAL DONATION (Wheel Spin)
document.getElementById('manual-submit').addEventListener('click', async () => {
  const name = document.getElementById('manual-name').value.trim();
  const amountUSD = parseFloat(document.getElementById('manual-amount').value);
  //const doubler = document.getElementById('manual-doubler').checked;

  if (!name || isNaN(amountUSD) || amountUSD <= 0) {
    alert("Please enter a valid name and donation amount.");
    return;
  }

  // Send the sequence and total time to the server for display + timer update
  ws.send(JSON.stringify({
    type: 'donation',
    donorName: name,
    donationAmount: amountUSD,
    donationType: 'manual'
  }));

});

//Happy Hour Countdown
document.getElementById('set-happy-hour-countdown-btn').addEventListener('click', () => {
  const hours = parseInt(document.getElementById('happy-hour-countdown-hours').value) || 0;
  const minutes = parseInt(document.getElementById('happy-hour-countdown-minutes').value) || 0;
  const seconds = parseInt(document.getElementById('happy-hour-countdown-seconds').value) || 0;
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

  ws.send(JSON.stringify({ type: 'setHappyHourDuration', amount: totalSeconds }));
});

// --- Fundraising Goal and Progress Controls ---
document.getElementById('set-fundraising-goal').addEventListener('click', () => {
  const goal = parseFloat(document.getElementById('fundraising-goal').value) || 0;
  ws.send(JSON.stringify({ type: 'setFundraisingGoal', goal }));
});

document.getElementById('set-funds-raised').addEventListener('click', () => {
  const raised = parseFloat(document.getElementById('funds-raised').value) || 0;
  ws.send(JSON.stringify({ type: 'setFundsRaised', raised }));
});