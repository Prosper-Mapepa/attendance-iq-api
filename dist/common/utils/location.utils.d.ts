export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
export declare function verifyLocation(studentLat: number, studentLng: number, classLat: number, classLng: number, radius?: number): boolean;
export declare function getLocationAccuracyMessage(distance: number, radius: number): string;
