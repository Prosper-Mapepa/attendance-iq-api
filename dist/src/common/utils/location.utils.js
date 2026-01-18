"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.verifyLocation = verifyLocation;
exports.getLocationAccuracyMessage = getLocationAccuracyMessage;
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function verifyLocation(studentLat, studentLng, classLat, classLng, radius = 9.144) {
    if (!studentLat || !studentLng || !classLat || !classLng) {
        return false;
    }
    const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
    return distance <= radius;
}
function getLocationAccuracyMessage(distance, radius) {
    const distanceFeet = distance * 3.28084;
    const radiusFeet = radius * 3.28084;
    if (distance <= radius) {
        return `Location verified (${Math.round(distanceFeet)}ft from class, within ${Math.round(radiusFeet)}ft radius)`;
    }
    else {
        return `Too far from class. You are ${Math.round(distanceFeet)}ft away, but must be within ${Math.round(radiusFeet)}ft radius to clock in/out`;
    }
}
//# sourceMappingURL=location.utils.js.map