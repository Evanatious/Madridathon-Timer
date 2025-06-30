function getMinesweeperSVG(type, isExploded = false) {
    if (type === 'mine' || type === '💣') {
        return isExploded
            ? '/assets/Mine exploded.svg'
            : '/assets/Mine.svg';
    }
    // For numbers 1-8
    return `/assets/Minesweeper_${type}.svg`;
}

function pickWeightedRandom(probSet) {
    const rand = Math.random();
    let sum = 0;
    for (const [key, weight] of Object.entries(probSet)) {
        sum += weight;
        if (rand < sum) return key;
    }
    // fallback (should never happen if weights sum to 1)
    return Object.keys(probSet)[0];
}


const VISUAL_PROBABILITIES = {
    default: {
        "1": 0.35,
        "2": 0.20,
        "3": 0.15,
        "4": 0.10,
        "5": 0.08,
        "6": 0.05,
        "7": 0.04,
        "8": 0.03
    },
    withBomb: {
        "💣": 0.23,
        "1": 0.20,
        "2": 0.15,
        "3": 0.12,
        "4": 0.10,
        "5": 0.08,
        "6": 0.05,
        "7": 0.04,
        "8": 0.03
    }
};

class AnimatedWheelMultiplier {
    constructor() {
        this.wheelContainer = null;
    }

    getTimerPosition() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            const rect = timerElement.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            };
        }
        return {
            top: window.innerHeight * 0.3,
            left: window.innerWidth * 0.5,
            width: 400,
            height: 100
        };
    }

    createWheelContainer() {
        if (this.wheelContainer) return this.wheelContainer;
        const timerPos = this.getTimerPosition();
        const container = document.createElement('div');
        container.id = 'wheel-container';
        container.style.cssText = `
            position: absolute;
            top: ${timerPos.top - 120}px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: none;
        `;
        container.innerHTML = `
            <div style="
                width: 400px;
                height: 80px;
                background: rgba(31, 41, 55, 0.9);
                border-radius: 12px;
                overflow: hidden;
                border: 16px solid #b3b3b3;
                position: relative;
                margin: 0 auto;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 50.5%;
                    width: 4px;
                    height: 100%;
                    background: #fbbf24;
                    z-index: 10;
                    transform: translateX(-50%);
                    box-shadow: 0 0 10px #fbbf24;
                "></div>
                <div id="wheel" style="
                    display: flex;
                    height: 100%;
                    align-items: center;
                    transition: transform 0.1s ease-out;
                "></div>
            </div>
            <div id="floating-result" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2.5rem;
                font-weight: bold;
                color: #fbbf24;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                z-index: 20;
                opacity: 0;
                pointer-events: none;
                white-space: nowrap;
                min-width: 300px;
                text-align: center;
            "></div>
        `;
        document.body.appendChild(container);
        this.wheelContainer = container;
        return container;
    }

    createWheelCell(type, isExploded = false) {
        const cell = document.createElement('div');
        cell.style.cssText = `
            width: 76px;
            height: 76px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #000000;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
            background: #181d22;
        `;

        // SVG image instead of text
        const img = document.createElement('img');
        img.src = getMinesweeperSVG(type, isExploded);
        img.alt = String(type);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.userSelect = 'none';
        img.style.pointerEvents = 'none';

        // Accessibility: visually hidden number for screen readers
        img.setAttribute('aria-label', String(type));

        cell.appendChild(img);

        // Optionally, special border for bomb/exploded
        if (type === 'mine' || type === '💣') {
            if (isExploded) {
                cell.style.border = '3px solid #f43f5e';
                cell.style.backgroundColor = '#dc2626';
            } else {
                cell.style.border = '2px solid #fbbf24';
            }
        }

        return cell;
    }

    renderWheel(items) {
        const wheelElement = document.getElementById('wheel');
        if (!wheelElement) return;
        wheelElement.innerHTML = '';
        items.forEach(item => {
            const cell = this.createWheelCell(item);
            wheelElement.appendChild(cell);
        });
    }

    showFloatingResult(type, value) {
        const floatingResult = document.getElementById('floating-result');
        if (!floatingResult) return;
        let text;
        if (type === 'mine' || type === '💣') {
            text = "💥 BLAST!";
            floatingResult.style.color = '#ef4444';
        } else {
            text = value;
            floatingResult.style.color = '#fbbf24';
        }
        floatingResult.textContent = text;
        floatingResult.style.opacity = 1;
        floatingResult.style.animation = 'floatUp 2.5s ease-out';
        setTimeout(() => {
            floatingResult.style.animation = '';
            floatingResult.style.opacity = 0;
        }, 2500);
    }

    async spinWithResult(targetResult, targetTier) {
        console.log("spinWithResult received targetTier:", targetTier);

        return new Promise((resolve) => {
            this.createWheelContainer();
            this.wheelContainer.style.display = 'block';

            // Choose visual table based on tier
            let probSet = (targetTier === 'default')
                ? VISUAL_PROBABILITIES.default
                : VISUAL_PROBABILITIES.withBomb;

            // Fill the wheel with weighted randoms
            const items = [];
            const wheelLength = 80, stopPosition = 70;
            for (let i = 0; i < wheelLength; i++) {
                items.push(pickWeightedRandom(probSet));
            }
            items[stopPosition] = targetResult; // Place actual result at stop position
            this.renderWheel(items);

            //Animate wheel
            const cellWidth = 76;
            const randomOffset = ((Math.random() * 2) - 1) * 0.25 * cellWidth;
            const duration = 6000;
            const startTime = Date.now();
            const maxDistance = (wheelLength - 10) * cellWidth + randomOffset;
            const wheelElement = document.getElementById('wheel');

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 4);
                const currentPosition = -maxDistance * easeOut;
                if (wheelElement) {
                    wheelElement.style.transform = `translateX(${currentPosition}px)`;
                }
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete
                    if (targetResult === 'mine' || targetResult === '💣') {
                        const targetCell = wheelElement?.children[71];
                        if (targetCell) {
                            const explodedCell = this.createWheelCell('💣', true);
                            wheelElement.replaceChild(explodedCell, targetCell);
                        }
                    }
                    setTimeout(() => {
                        resolve();
                    }, 300);
                }
            };
            requestAnimationFrame(animate);
        });
    }
}

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

window.wheelMultiplier = new AnimatedWheelMultiplier();

window.animateWheelSequenceWithTimerUpdate = async function(rolls, donorName, donationAmount, ws, donationType) {
  if (!window.wheelMultiplier) return;

  const wheelContainer = window.wheelMultiplier.createWheelContainer();
  wheelContainer.style.display = 'block';

  let donorBanner = document.getElementById('donor-banner');
  if (!donorBanner) {
    donorBanner = document.createElement('div');
    donorBanner.id = 'donor-banner';
    donorBanner.style.position = 'absolute';
    donorBanner.style.top = '-100px';
    donorBanner.style.left = '50%';
    donorBanner.style.transform = 'translateX(-50%)';
    donorBanner.style.color = '#fff';
    donorBanner.style.background = 'rgba(0,0,0,0.5)';
    donorBanner.style.fontSize = '2rem';
    donorBanner.style.padding = '6px 32px';
    donorBanner.style.borderRadius = '18px';
    donorBanner.style.zIndex = '1100';
    donorBanner.style.textAlign = 'center';
    donorBanner.style.boxShadow = '0 4px 32px #0009';
    wheelContainer.appendChild(donorBanner);
  }

  if (donationType === 'manual') {
    donorBanner.textContent = `${donorName} - $${Number(donationAmount).toFixed(2)}`;
  } else if (donationType === 'sub') {
    donorBanner.textContent = `${donorName} - 1 Sub`;
  } else if (donationType === 'gifted') {
    const subCount = donationAmount / 300; // Assuming $3 per sub
    donorBanner.textContent = `${donorName} - ${subCount} Gifted Subs`;
  }

  for (let i = 0; i < rolls.length; i++) {
    const roll = rolls[i];
    await window.wheelMultiplier.spinWithResult(roll.spinResult, roll.tier);

    let addText;
    if (roll.isBomb) {
      addText = '+1 hour!';
      window.wheelMultiplier.showFloatingResult('💣', addText);
    } else {
      addText = `+${formatTime(roll.secondsToAdd)}`;
      window.wheelMultiplier.showFloatingResult(roll.spinResult, addText);
    }

    ws.send(JSON.stringify({ type: 'add', amount: roll.secondsToAdd }));

    //Pop the timer
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.classList.remove('pop');
      void timerEl.offsetWidth; // restart animation if rapid
      timerEl.classList.add('pop');
      setTimeout(() => {
        timerEl.classList.remove('pop');
      }, 800); // a bit longer than your .35s animation
    }
    await new Promise(res => setTimeout(res, 1200));
  }

  setTimeout(() => {
    wheelContainer.style.display = 'none';
    donorBanner.textContent = '';
  }, 1300);
};
