// wheel.js - Standalone Animated Wheel Multiplier Module with Queue System

class AnimatedWheelMultiplier {
    constructor() {
        this.probabilities = {
            default: {
                "1": 0.35,
                "2": 0.25,
                "3": 0.18,
                "4": 0.12,
                "5": 0.06,
                "6": 0.03,
                "7": 0.00917,
                "8": 0.00083
            },
            fiftyDonation: {
                "1": 0.30,
                "2": 0.20,
                "3": 0.15,
                "4": 0.12,
                "5": 0.06,
                "6": 0.03,
                "7": 0.00917,
                "8": 0.00083,
                "mine": 0.12
            },
            hundredDonation: {
                "1": 0.26375,
                "2": 0.20,
                "3": 0.15,
                "4": 0.12,
                "5": 0.06,
                "6": 0.03,
                "7": 0.00917,
                "8": 0.00083,
                "mine": 0.15625
            },
            twohundredDonation: {
                "1": 0.21375,
                "2": 0.20,
                "3": 0.15,
                "4": 0.12,
                "5": 0.06,
                "6": 0.03,
                "7": 0.00917,
                "8": 0.00083,
                "mine": 0.20625
            }
        };

        this.wheelContainer = null;
        this.isSpinning = false;
        this.wheelItems = [];
        this.currentResult = null;

        // Queue system properties
        this.spinQueue = [];
        this.isProcessingQueue = false;
        this.lastSpinEndTime = 0;
        this.QUEUE_DELAY = 3500; // 3.5 seconds delay after wheel ends
    }

    // Get timer element position for proper positioning
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
        // Fallback to center if timer not found
        return {
            top: window.innerHeight * 0.3,
            left: window.innerWidth * 0.5,
            width: 400,
            height: 100
        };
    }

    // Update wheel position if timer moves
    updateWheelPosition() {
        if (this.wheelContainer && this.wheelContainer.style.display !== 'none') {
            const timerPos = this.getTimerPosition();
            this.wheelContainer.style.top = `${timerPos.top - 120}px`;
        }
    }

    // Create the wheel container element
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

    // Create wheel cell element
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

        if (type === 'mine') {
            if (isExploded) {
                cell.style.animation = 'explosion 0.5s ease-out';
                cell.style.backgroundColor = '#ef4444';
            }

            // Try to load mine SVG, fallback to text
            const img = document.createElement('img');
            img.src = isExploded ? 'assets/Mine exploded.svg' : 'assets/Mine.svg';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
            img.onerror = function () {
                cell.innerHTML = isExploded ? '💥' : '💣';
                cell.style.fontSize = '1.5rem';
                cell.style.fontWeight = 'bold';
                cell.style.color = 'white';
                cell.style.backgroundColor = isExploded ? '#dc2626' : '#374151';
            };
            cell.appendChild(img);
        } else {
            // Try to load number SVG, fallback to text
            const img = document.createElement('img');
            img.src = `assets/${type} Cell.svg`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
            img.onerror = function () {
                cell.innerHTML = `${type}×`;
                cell.style.fontSize = '1.5rem';
                cell.style.fontWeight = 'bold';
                cell.style.color = 'white';
                const colors = {
                    '1': '#10b981', '2': '#3b82f6', '3': '#8b5cf6', '4': '#ec4899',
                    '5': '#f43f5e', '6': '#f59e0b', '7': '#ea580c', '8': '#dc2626'
                };
                cell.style.backgroundColor = colors[type] || '#6b7280';
            };
            cell.appendChild(img);
        }

        return cell;
    }

    // Select result based on probability
    selectResult(probs) {
        const random = Math.random();
        let cumulative = 0;

        for (const [outcome, probability] of Object.entries(probs)) {
            cumulative += probability;
            if (random <= cumulative) {
                return outcome === "mine" ? "mine" : outcome;
            }
        }
        return "1"; // Fallback
    }

    // Generate wheel ensuring no adjacent duplicates
    generateWheel(targetResult, type) {
        let items;
        if (type === 'default') {
            items = ['1', '2', '3', '4', '5', '6', '7', '8'];
        } else {
            items = ['1', '2', '3', '4', '5', '6', '7', '8', 'mine'];
        }

        const wheelLength = 80;
        const wheel = new Array(wheelLength);
        const stopPosition = 71;

        wheel[stopPosition] = targetResult;

        for (let i = 0; i < wheelLength; i++) {
            if (i === stopPosition) continue;

            let attempts = 0;
            let candidate;
            do {
                candidate = items[Math.floor(Math.random() * items.length)];
                attempts++;
            } while (
                attempts < 20 &&
                ((i > 0 && wheel[i - 1] === candidate) ||
                    (i < wheelLength - 1 && wheel[i + 1] === candidate))
            );

            wheel[i] = candidate;
        }

        return { wheel, stopPosition };
    }

    // Render wheel
    renderWheel(items) {
        const wheelElement = document.getElementById('wheel');
        if (!wheelElement) return;

        wheelElement.innerHTML = '';

        items.forEach((item, index) => {
            const cell = this.createWheelCell(item);
            wheelElement.appendChild(cell);
        });
    }

    // Format time result for display
    formatTimeResult(seconds) {
        if (seconds < 60) {
            return `+${seconds} sec`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (remainingSeconds === 0) {
            return `+${minutes}m`;
        } else {
            return `+${minutes}m ${remainingSeconds}sec`;
        }
    }

    // Show floating result animation
    showFloatingResult(type, value) {
        const floatingResult = document.getElementById('floating-result');
        if (!floatingResult) return;

        let text;
        if (type === 'mine') {
            text = "💥 BLAST!";
            floatingResult.style.color = '#ef4444';
        } else {
            text = this.formatTimeResult(value);
            floatingResult.style.color = '#fbbf24';
        }

        floatingResult.textContent = text;

        // Create animation keyframes dynamically
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) translateY(0px);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) translateY(-80px);
                }
                80% {
                    opacity: 1;
                    transform: translate(-50%, -50%) translateY(-80px);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) translateY(-100px);
                }
            }
            @keyframes explosion {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); background-color: #ef4444; }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        floatingResult.style.animation = 'floatUp 3s ease-out';

        setTimeout(() => {
            floatingResult.style.animation = '';
        }, 3000);
    }

    // Queue management methods
    addToQueue(seconds, type, doublerFlag) {
        return new Promise((resolve) => {
            this.spinQueue.push({
                seconds,
                type,
                doublerFlag,
                resolve
            });

            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.spinQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.spinQueue.length > 0) {
            // Check if we need to wait for the delay after the last spin
            const timeSinceLastSpin = Date.now() - this.lastSpinEndTime;
            if (timeSinceLastSpin < this.QUEUE_DELAY) {
                const waitTime = this.QUEUE_DELAY - timeSinceLastSpin;
                console.log(`Waiting ${waitTime}ms before next wheel spin...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            const spinRequest = this.spinQueue.shift();

            try {
                const result = await this.animatedWheelMultiplierInternal(
                    spinRequest.seconds,
                    spinRequest.type,
                    spinRequest.doublerFlag
                );
                spinRequest.resolve(result);
            } catch (error) {
                console.error('Error during wheel spin:', error);
                spinRequest.resolve(0);
            }

            // Update the last spin end time
            this.lastSpinEndTime = Date.now();
        }

        this.isProcessingQueue = false;
    }

    // Internal spinning function (renamed from animatedWheelMultiplier)
    async animatedWheelMultiplierInternal(seconds, type, doublerFlag) {
        return new Promise((resolve) => {
            if (this.isSpinning) {
                resolve(0);
                return;
            }

            this.isSpinning = true;

            // Create and show wheel container
            this.createWheelContainer();
            this.wheelContainer.style.display = 'block';

            const selectedResult = this.selectResult(this.probabilities[type]);
            const { wheel, stopPosition } = this.generateWheel(selectedResult, type);
            this.wheelItems = wheel;
            this.renderWheel(wheel);

            const cellWidth = 66;
            const randomOffset = Math.random() * cellWidth;
            const duration = 8000;
            const startTime = Date.now();
            const maxDistance = (wheel.length - 10) * cellWidth + randomOffset;

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
                    this.isSpinning = false;

                    let finalValue;
                    if (selectedResult === 'mine') {
                        finalValue = 0;
                        // Update the mine cell to exploded state
                        const targetCell = wheelElement?.children[71];
                        if (targetCell) {
                            const explodedCell = this.createWheelCell('mine', true);
                            wheelElement.replaceChild(explodedCell, targetCell);
                        }
                        this.showFloatingResult('mine', 0);
                    } else {
                        const multiplier = parseInt(selectedResult);
                        finalValue = seconds * multiplier * (doublerFlag ? 2 : 1);
                        this.showFloatingResult(selectedResult, finalValue);
                    }

                    // Hide wheel container after 3 seconds
                    setTimeout(() => {
                        if (this.wheelContainer) {
                            this.wheelContainer.style.display = 'none';
                        }
                    }, 3000);

                    resolve(finalValue);
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // Public method to trigger wheel spin (now uses queue)
    async spin(seconds = 10, type = 'default', doublerFlag = 0) {
        return await this.addToQueue(seconds, type, doublerFlag);
    }

    // Clean up
    destroy() {
        if (this.wheelContainer) {
            this.wheelContainer.remove();
            this.wheelContainer = null;
        }
        this.spinQueue = [];
        this.isProcessingQueue = false;
    }
}

// Create global instance
window.wheelMultiplier = new AnimatedWheelMultiplier();

// Expose the spin function globally for easy access
window.spinWheel = (seconds, type, doublerFlag) => {
    return window.wheelMultiplier.spin(seconds, type, doublerFlag);
};