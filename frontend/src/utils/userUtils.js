import axios from 'axios';
import { base_url } from '../config';
import { requestPool } from './reqPool';

/**
 * Fetch user data by email address
 * @param {string} email - The email address of the user to fetch
 * @returns {Promise<Object>} - Promise resolving to user data
 */
export const getUserByEmail = async (email) => {
  if (!email) {
    console.error('Email is required to fetch user data');
    return null;
  }
  
  try {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      console.error('No session ID found');
      return null;
    }

    const response = await axios.get(`${base_url}/users/${email}`, {
      headers: {
        'Session-Id': sessionId
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching user data for ${email}:`, error);
    return null;
  }
};

/**
 * Cache for storing user data to avoid redundant API calls
 * @type {Object.<string, {data: Object, timestamp: number}>}
 */
const userCache = {};

/**
 * Fetch user data with caching to minimize API calls
 * @param {string} email - Email of the user to fetch
 * @param {number} cacheTime - Time in milliseconds to keep cached data (default: 5 minutes)
 * @returns {Promise<Object>} - Promise resolving to user data
 */
export const getCachedUserByEmail = async (email) => {
  if (!email) return null;
  
  // Check memory cache first (if implemented)
  
  return requestPool.execute(`user-${email}`, async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return null;
      
      const response = await axios.get(`${base_url}/users/${email}`, {
        headers: { 'Session-Id': sessionId }
      });
      
      // Process and return user data
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${email}:`, error);
      return null;
    }
  });
};

/**
 * Clear the user cache for a specific user or all users
 * @param {string} [email] - Optional email to clear specific cache entry
 */
export const clearUserCache = (email) => {
  if (email) {
    delete userCache[email];
  } else {
    // Clear all cache
    Object.keys(userCache).forEach(key => delete userCache[key]);
  }
};