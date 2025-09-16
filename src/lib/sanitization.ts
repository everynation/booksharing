/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gis, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/on\w+\s*=\s*["'].*?["']/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocols (except data:image)
  sanitized = sanitized.replace(/data:(?!image)/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitizes text content for safe display
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Limit length to prevent excessive content
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '...';
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitizes user input for chat messages
 */
export function sanitizeChatMessage(message: string): string {
  if (!message) return '';
  
  // Remove HTML tags
  let sanitized = message.replace(/<[^>]*>/g, '');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Limit message length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }
  
  // Remove potentially dangerous patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  return sanitized;
}

/**
 * Generic input sanitization function
 */
export function sanitizeInput(input: string): string {
  return sanitizeChatMessage(input);
}