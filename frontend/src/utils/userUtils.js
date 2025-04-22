import axios from 'axios';
import { base_url } from '../config';

/**
 * Fetch user data by email address
 * @param {string} email - The email address of the user to fetch
 * @returns {Promise<Object>} - Promise resolving to user data
 */
export const getUserByEmail = async (email) => {
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
export const getCachedUserByEmail = async (email, cacheTime = 300000) => {
  // Return from cache if available and not expired
  const cachedUser = userCache[email];
  const now = Date.now();
  
  if (cachedUser && (now - cachedUser.timestamp < cacheTime)) {
    return cachedUser.data;
  }
  
  // Fetch fresh data
  const userData = await getUserByEmail(email);
  
  // Cache the result if successful
  if (userData) {
    userCache[email] = {
      data: userData,
      timestamp: now
    };
  }
  
  return userData;
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