const ws = new WebSocket(`ws://${window.location.host}`);

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
