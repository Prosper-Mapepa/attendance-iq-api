/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Verify if student location is within allowed radius of class location
 * Uses strict verification: distance must be <= radius (no tolerance buffer)
 * @param studentLat Student's latitude
 * @param studentLng Student's longitude
 * @param classLat Class location latitude
 * @param classLng Class location longitude
 * @param radius Allowed radius in meters (default: 9.144m = 30ft for precise verification)
 * @returns True if within radius, false otherwise
 */
export function verifyLocation(
  studentLat: number,
  studentLng: number,
  classLat: number,
  classLng: number,
  radius: number = 9.144 // Default: 30 feet
): boolean {
  if (!studentLat || !studentLng || !classLat || !classLng) {
    return false; // Missing location data - strict: fail if any location is missing
  }

  const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
  // Strict verification: must be exactly within radius (distance <= radius)
  return distance <= radius;
}

/**
 * Get location accuracy message for user feedback
 * @param distance Distance in meters
 * @param radius Allowed radius in meters
 * @returns User-friendly message
 */
export function getLocationAccuracyMessage(distance: number, radius: number): string {
  // Convert to feet for user-friendly display (1 meter = 3.28084 feet)
  const distanceFeet = distance * 3.28084;
  const radiusFeet = radius * 3.28084;
  
  if (distance <= radius) {
    return `Location verified (${Math.round(distanceFeet)}ft from class, within ${Math.round(radiusFeet)}ft radius)`;
  } else {
    return `Too far from class. You are ${Math.round(distanceFeet)}ft away, but must be within ${Math.round(radiusFeet)}ft radius to clock in/out`;
  }
}
