export function isFiniteNumber(value) {
    return Number.isFinite(value);
}

export function toFiniteNumber(value, fallback = 0) {
    return Number.isFinite(value) ? value : fallback;
}

export function normalizeVector(x, y, fallbackX = 0, fallbackY = 0) {
    const safeX = toFiniteNumber(x, fallbackX);
    const safeY = toFiniteNumber(y, fallbackY);
    const magnitude = Math.hypot(safeX, safeY);

    if (magnitude === 0) {
        return {
            x: fallbackX,
            y: fallbackY,
            magnitude: 0
        };
    }

    return {
        x: safeX / magnitude,
        y: safeY / magnitude,
        magnitude
    };
}
