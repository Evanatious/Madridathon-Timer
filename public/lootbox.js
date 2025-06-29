// lootbox.js

let loadedProbabilities = null;

// Load probabilities from JSON
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

function getRandomMultiplier(donationAmount) {
  if (!loadedProbabilities) return 1;
  const probSet = getProbabilityTier(donationAmount);
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

function triggerLootbox(donationAmount) {
  const container = document.getElementById('lootbox-container');
  const strip = document.getElementById('lootbox-strip');
  const timeAdded = document.getElementById('time-added');
  const tileWidth = 88;
  const totalTiles = 300;
  const centerIndex = 150;

  strip.innerHTML = '';
  timeAdded.innerText = '';
  container.classList.remove('hidden');

  const keys = Object.keys(loadedProbabilities.default);
  const tiles = [];
  for (let i = 0; i < totalTiles; i++) {
    const num = keys[Math.floor(Math.random() * keys.length)];
    const div = document.createElement('div');
    div.className = 'lootbox-tile';
    div.innerText = num;
    tiles.push(div);
    strip.appendChild(div);
  }

  const final = getRandomMultiplier(donationAmount);
  tiles[centerIndex].innerText = final;
  tiles[centerIndex].classList.add('final-tile');

  const targetOffset = centerIndex * tileWidth;
  let currentOffset = 1320; // scroll from left side to center
  let velocity = 60;
  const deceleration = 0.5;

  function animate() {
    if (velocity > 0) {
      currentOffset -= velocity;
      velocity -= deceleration;
      strip.style.transform = `translateX(-${currentOffset}px)`;
      requestAnimationFrame(animate);
    } else {
      strip.style.transform = `translateX(-${targetOffset}px)`;
      showResult();
    }
  }

  function showResult() {
    if (final === "💣") {
      timeAdded.innerText = "💥 BOMB!";
      container.classList.add('hidden');
      return;
    }

    const multiplier = parseInt(final);
    const totalMinutes = Math.floor(donationAmount * multiplier);
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    let timeStr = '+' + (h > 0 ? `${h}h ` : '') + `${m}m`;

    timeAdded.innerText = timeStr;

    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.classList.add('pop');
      setTimeout(() => {
        timerEl.classList.remove('pop');
      }, 300);
    }

    if (typeof socket !== 'undefined') {
      socket.send(JSON.stringify({ type: 'add', amount: totalMinutes * 60 }));
    }

    setTimeout(() => {
      container.classList.add('hidden');
    }, 3000);
  }

  requestAnimationFrame(animate);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'l') {
    triggerLootbox(10);
  }
});
