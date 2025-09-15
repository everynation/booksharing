import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '@/utils/distance';

describe('distance utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between Seoul and Busan correctly', () => {
      // Seoul coordinates
      const lat1 = 37.5665;
      const lon1 = 126.9780;
      
      // Busan coordinates  
      const lat2 = 35.1796;
      const lon2 = 129.0756;
      
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      // Seoul to Busan is approximately 325km
      expect(distance).toBeGreaterThan(320);
      expect(distance).toBeLessThan(330);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.5665, 126.9780, 37.5665, 126.9780);
      expect(distance).toBe(0);
    });

    it('should return correct distance for close locations', () => {
      // Two points in Seoul, approximately 1km apart
      const distance = calculateDistance(37.5665, 126.9780, 37.5756, 126.9769);
      expect(distance).toBeGreaterThan(0.8);
      expect(distance).toBeLessThan(1.2);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -34.6037, -58.3816);
      expect(distance).toBeGreaterThan(11000); // Sydney to Buenos Aires
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
      expect(formatDistance(0.999)).toBe('999m');
    });

    it('should format distances 1km and above in kilometers', () => {
      expect(formatDistance(1)).toBe('1km');
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(10.7)).toBe('10.7km');
      expect(formatDistance(100)).toBe('100km');
    });

    it('should handle edge cases', () => {
      expect(formatDistance(0)).toBe('0m');
      expect(formatDistance(1.0)).toBe('1km');
    });
  });
});