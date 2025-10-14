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
 * @param studentLat Student's latitude
 * @param studentLng Student's longitude
 * @param classLat Class location latitude
 * @param classLng Class location longitude
 * @param radius Allowed radius in meters (default: 50)
 * @returns True if within radius, false otherwise
 */
export function verifyLocation(
  studentLat: number,
  studentLng: number,
  classLat: number,
  classLng: number,
  radius: number = 50
): boolean {
  if (!studentLat || !studentLng || !classLat || !classLng) {
    return false; // Missing location data
  }

  const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
  return distance <= radius;
}

/**
 * Get location accuracy message for user feedback
 * @param distance Distance in meters
 * @param radius Allowed radius in meters
 * @returns User-friendly message
 */
export function getLocationAccuracyMessage(distance: number, radius: number): string {
  if (distance <= radius) {
    return `Location verified (${Math.round(distance)}m from class)`;
  } else {
    return `Too far from class (${Math.round(distance)}m, max ${radius}m)`;
  }
}
