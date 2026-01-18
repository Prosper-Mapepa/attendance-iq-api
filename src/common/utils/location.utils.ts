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
 * Includes GPS accuracy tolerance for Android and other devices
 * @param studentLat Student's latitude
 * @param studentLng Student's longitude
 * @param classLat Class location latitude
 * @param classLng Class location longitude
 * @param radius Allowed radius in feet (default: 30ft for precise verification)
 * @param userAgent Optional user agent string to detect Android devices
 * @param osVersion Optional OS version string to detect Android devices
 * @returns True if within radius, false otherwise
 */
export function verifyLocation(
  studentLat: number,
  studentLng: number,
  classLat: number,
  classLng: number,
  radius: number = 30, // Default: 30 feet (stored in feet now)
  userAgent?: string,
  osVersion?: string
): boolean {
  if (!studentLat || !studentLng || !classLat || !classLng) {
    return false; // Missing location data
  }

  // Convert radius from feet to meters for distance calculation
  const radiusInMeters = radius * 0.3048; // 1 foot = 0.3048 meters
  
  // Detect Android devices - Android has significantly worse GPS accuracy than iOS
  const isAndroid = 
    (userAgent && /android/i.test(userAgent)) ||
    (osVersion && /android/i.test(osVersion)) ||
    (osVersion && /^[\d.]+$/.test(osVersion) && parseFloat(osVersion) < 20); // Android version numbers are typically < 20
  
  // Android devices can have GPS accuracy issues of 20-50 meters (65-164 feet) in buildings
  // iOS devices typically have 5-15 meters (16-49 feet) accuracy
  // Use much higher tolerance for Android devices
  let baseTolerance: number;
  let percentageTolerance: number;
  
  if (isAndroid) {
    // Android: 50 meters (164 feet) base + 50% of radius
    baseTolerance = 50; // meters (164 feet) - higher tolerance for Android GPS inaccuracy
    percentageTolerance = radiusInMeters * 0.5; // 50% of radius for Android
  } else {
    // iOS/Other: 20 meters (65.6 feet) base + 25% of radius
    baseTolerance = 20; // meters (65.6 feet) - standard tolerance for iOS
    percentageTolerance = radiusInMeters * 0.25; // 25% of radius
  }
  
  const gpsTolerance = Math.max(baseTolerance, percentageTolerance); // Use whichever is larger
  
  const distance = calculateDistance(studentLat, studentLng, classLat, classLng);
  
  // Allow within radius + GPS tolerance to prevent false negatives
  return distance <= (radiusInMeters + gpsTolerance);
}

/**
 * Get location accuracy message for user feedback
 * @param distance Distance in meters
 * @param radius Allowed radius in feet (stored in feet now)
 * @param userAgent Optional user agent string to detect Android devices
 * @param osVersion Optional OS version string to detect Android devices
 * @returns User-friendly message
 */
export function getLocationAccuracyMessage(
  distance: number, 
  radius: number,
  userAgent?: string,
  osVersion?: string
): string {
  // Convert distance to feet for display (1 meter = 3.28084 feet)
  const distanceFeet = distance * 3.28084;
  const radiusInMeters = radius * 0.3048; // Convert radius from feet to meters
  
  // Detect Android devices - use same logic as verifyLocation
  const isAndroid = 
    (userAgent && /android/i.test(userAgent)) ||
    (osVersion && /android/i.test(osVersion)) ||
    (osVersion && /^[\d.]+$/.test(osVersion) && parseFloat(osVersion) < 20);
  
  // Use same tolerance calculation as verifyLocation
  let baseTolerance: number;
  let percentageTolerance: number;
  
  if (isAndroid) {
    baseTolerance = 50; // meters (164 feet) for Android
    percentageTolerance = radiusInMeters * 0.5; // 50% of radius for Android
  } else {
    baseTolerance = 20; // meters (65.6 feet) for iOS
    percentageTolerance = radiusInMeters * 0.25; // 25% of radius
  }
  
  const gpsTolerance = Math.max(baseTolerance, percentageTolerance);
  
  if (distance <= (radiusInMeters + gpsTolerance)) {
    return `Location verified (${Math.round(distanceFeet)}ft from class, within ${Math.round(radius)}ft radius)`;
  } else {
    return `Too far from class. You are ${Math.round(distanceFeet)}ft away, but must be within ${Math.round(radius)}ft radius to clock in/out`;
  }
}
