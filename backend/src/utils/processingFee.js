/**
 * processingFee.js
 *
 * Processing fee rates (PKR per kg of processed output).
 * Values are read from environment variables with sensible defaults.
 * Pass `processedGoodType` (a MaterialType enum value) to get the rate.
 */

const FEE_RATES = {
    FLOUR: parseFloat(process.env.FEE_RATE_FLOUR) || 2.5,
    BRAN: parseFloat(process.env.FEE_RATE_BRAN) || 1.0,
    SEMOLINA: parseFloat(process.env.FEE_RATE_SEMOLINA) || 3.0,
    WHEAT: 0, // Raw wheat stored as-is; no processing fee on deposit
};

/**
 * Calculate the processing fee for a withdrawal.
 * @param {string} processedGoodType - MaterialType enum value (e.g. 'FLOUR')
 * @param {number} weightKg          - Weight of processed goods being withdrawn
 * @returns {number}                 - Fee amount in PKR
 */
function calculateFee(processedGoodType, weightKg) {
    const rate = FEE_RATES[processedGoodType];
    if (rate === undefined) {
        throw new Error(`Unknown processed good type: ${processedGoodType}`);
    }
    return parseFloat((rate * weightKg).toFixed(2));
}

module.exports = { calculateFee, FEE_RATES };
