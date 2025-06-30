// timeCalculator.js

/**
 * Calculates the lootbox/wheel result for a donation, sub, or bit event.
 * Handles happy hour, donation tier, and random roll.
 * Does NOT do reroll—one call = one spin. Reroll handled outside.
 * 
 * @param {number} amount      // Donation in USD in cents (300 for 1 sub or gifted)
 * @param {object} probabilities  // Probabilities config object (from JSON)
 * @param {boolean} happyHour
 * @returns {object} {
 *   secondsToAdd,
 *   spinResult,    // e.g. 1-8, or '💣'
 *   isBomb,         // true if bomb
 *   tier,           // e.g. 'default', 'fiftyDonation', etc.
 * }
 */
function calculateTimeToAdd({ amount, probabilities, happyHour = false }) {
  // Pick the tier
  let tier = 'default';
  if (amount >= 20000) tier = 'twohundredDonation';
  else if (amount >= 10000) tier = 'hundredDonation';
  else if (amount >= 5000) tier = 'fiftyDonation';

  const probSet = probabilities[tier];
  if (!probSet) throw new Error('Probabilities not loaded for tier: ' + tier);

  // Default base: $3, 1 sub, or 300 bits adds 5 minutes pre-multiplier.
  const baseSeconds = (amount / 300) * 300;

  // Perform a random spin
  const rand = Math.random();
  let sum = 0;
  let spinResult = "1";
  for (const [key, weight] of Object.entries(probSet)) {
    sum += weight;
    if (rand <= sum) {
      spinResult = key;
      break;
    }
  }

  // Handle bomb/mine
  if (spinResult === "💣" || spinResult === "mine") {
    // +1 hour (3600s), but no multiplier. Let reroll happen outside.
    return {
      secondsToAdd: 3600 * (happyHour ? 2 : 1),
      spinResult: "💣",
      isBomb: true,
      tier
    };
  }

  // Multiplier logic: 8 gets 88x, 1-7 get 1-7x
  let multiplier;
  if (spinResult === "8") {
    multiplier = 88;
  } else {
    multiplier = parseInt(spinResult, 10);
    if (isNaN(multiplier)) multiplier = 1;
  }

  let totalSeconds = baseSeconds * multiplier;
  if (happyHour) totalSeconds *= 2;
  const secondsToAdd = Math.floor(totalSeconds);

  return {
    secondsToAdd,
    spinResult,
    isBomb: false,
    tier
  };
}

/**
 * Handles bomb reroll logic.
 * If it lands on a bomb, adds +1 hour and rerolls until a number is landed.
 * Returns total seconds to add and the roll sequence (for animation/logging).
 * 
 * @param {object} args - Same as calculateTimeToAdd
 * @returns {object} {
 *   totalSeconds,      // sum of all spins including bomb rerolls
 *   rolls: [ { spinResult, isBomb, secondsToAdd }, ... ],
 *   finalSpin          // the final (non-bomb) result
 * }
 */
async function donationWithBombReroll(args) {
  let totalSeconds = 0;
  let rolls = [];
  while (true) {
    const result = calculateTimeToAdd(args);
    rolls.push(result);
    totalSeconds += result.secondsToAdd;
    if (!result.isBomb) {
      return {
        totalSeconds,
        rolls,
        finalSpin: result.spinResult
      };
    }
    // Optional: await sleep(750) // if you want to animate bomb and pause before reroll
  }
}

module.exports = {
  calculateTimeToAdd,
  donationWithBombReroll
};
