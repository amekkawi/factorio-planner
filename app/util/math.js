export function calcRadian(cx, cy, r, deg) {
    const radian = deg % 360 * Math.PI / 180;
    return {
        x: cx + r * Math.cos(radian),
        y: cy + r * Math.sin(radian),
    };
}

export function calcAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

export function calcMidpoint(x1, y1, x2, y2) {
    return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2,
    };
}

export function calcAngledDistance(x, y, deg, distance) {
    return {
        x: Math.cos(deg * Math.PI / 180) * distance + x,
        y: Math.sin(deg * Math.PI / 180) * distance + y,
    };
}

export function calcDistance(x1, y1, x2, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}
