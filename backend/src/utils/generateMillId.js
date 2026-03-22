/**
 * generateMillId.js
 *
 * Generates a unique Mill ID per business rules:
 *  - First 3 letters of fullName (alphabetic only, uppercase)
 *  - Last 4 digits of phone number
 *  - Format: "JOH-4567"
 *
 * @param {string} fullName   - Customer's full name
 * @param {string} phone      - Customer's phone number (digits)
 * @returns {string}          - e.g. "JOH-4567"
 */
function generateMillId(fullName, phone) {
    // Strip non-alpha characters, take first 3 letters, pad if name is short
    const namePart = fullName
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, 'X'); // pad with 'X' if name has fewer than 3 alpha chars

    // Take last 4 digits of phone
    const digits = phone.replace(/\D/g, '');
    const phonePart = digits.slice(-4).padStart(4, '0');

    return `${namePart}-${phonePart}`;
}

module.exports = { generateMillId };
