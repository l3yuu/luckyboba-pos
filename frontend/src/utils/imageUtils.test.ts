import { describe, it, expect } from 'vitest';
import { getImageUrl } from './imageUtils';

describe('getImageUrl', () => {
  it('returns an empty string when path is null or undefined', () => {
    expect(getImageUrl(null)).toBe('');
    expect(getImageUrl(undefined)).toBe('');
  });

  it('returns the path as-is if it starts with http:// or https://', () => {
    const fullUrl = 'https://example.com/image.jpg';
    expect(getImageUrl(fullUrl)).toBe(fullUrl);
    
    const httpUrl = 'http://example.com/image.jpg';
    expect(getImageUrl(httpUrl)).toBe(httpUrl);
  });

  it('constructs a storage URL from a relative path', () => {
    const relativePath = 'menu_images/boba.jpg';
    // By default VITE_API_BASE_URL is not defined in test env unless we mock it or use the fallback
    // Fallback in imageUtils.ts: const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
    // rootUrl = 'http://localhost:8000'
    expect(getImageUrl(relativePath)).toBe('http://localhost:8000/storage/menu_images/boba.jpg');
  });
});
