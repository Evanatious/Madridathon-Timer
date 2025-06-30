
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
                border: 4px solid #4b5563;
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
            width: 66px;
            height: 72px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #000000;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
        `;
        if (type === 'mine' || type === '💣') {
            if (isExploded) {
                cell.style.animation = 'explosion 0.5s ease-out';
                cell.style.backgroundColor = '#ef4444';
            }
            cell.innerHTML = isExploded ? '💥' : '💣';
            cell.style.fontSize = '2rem';
            cell.style.fontWeight = 'bold';
            cell.style.color = 'white';
            cell.style.backgroundColor = isExploded ? '#dc2626' : '#374151';
        } else {
            cell.innerHTML = `${type}×`;
            cell.style.fontSize = '1.5rem';
            cell.style.fontWeight = 'bold';
            cell.style.color = 'white';
            const colors = {
                '1': '#10b981', '2': '#3b82f6', '3': '#8b5cf6', '4': '#ec4899',
                '5': '#f43f5e', '6': '#f59e0b', '7': '#ea580c', '8': '#dc2626'
            };
            cell.style.backgroundColor = colors[type] || '#6b7280';
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

    async spinWithResult(targetResult) {
        return new Promise((resolve) => {
            this.createWheelContainer();
            this.wheelContainer.style.display = 'block';

            const items = [];
            const allResults = ['1','2','3','4','5','6','7','8','💣'];
            const wheelLength = 80, stopPosition = 71;
            for (let i = 0; i < wheelLength; i++) {
                items.push(allResults[Math.floor(Math.random() * allResults.length)]);
            }
            items[stopPosition] = targetResult;
            this.renderWheel(items);

            const cellWidth = 66;
            const randomOffset = Math.random() * cellWidth;
            const duration = 2000;
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

window.wheelMultiplier = new AnimatedWheelMultiplier();

window.animateWheelSequenceWithTimerUpdate = async function(rolls, donorName, donationAmount, ws) {
  if (!window.wheelMultiplier) return;

  const wheelContainer = window.wheelMultiplier.createWheelContainer();
  wheelContainer.style.display = 'block';

  let donorBanner = document.getElementById('donor-banner');
  if (!donorBanner) {
    donorBanner = document.createElement('div');
    donorBanner.id = 'donor-banner';
    donorBanner.style.position = 'absolute';
    donorBanner.style.top = '-50px';
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
  donorBanner.textContent = `${donorName} - $${Number(donationAmount).toFixed(2)}`;

  for (let i = 0; i < rolls.length; i++) {
    const roll = rolls[i];
    await window.wheelMultiplier.spinWithResult(roll.spinResult);

    let addText;
    if (roll.isBomb) {
      addText = '+1 hour!';
      window.wheelMultiplier.showFloatingResult('💣', addText);
    } else {
      const min = Math.floor(roll.secondsToAdd / 60);
      const sec = roll.secondsToAdd % 60;
      addText = sec === 0 ? `+${min} min` : `+${min} min ${sec} sec`;
      window.wheelMultiplier.showFloatingResult(roll.spinResult, addText);
    }

    ws.send(JSON.stringify({ type: 'add', amount: roll.secondsToAdd }));
    await new Promise(res => setTimeout(res, 1200));
  }

  setTimeout(() => {
    wheelContainer.style.display = 'none';
    donorBanner.textContent = '';
  }, 1300);
};
