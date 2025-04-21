
/**
 * Returns the appropriate URL for a user's profile picture
 * @param {Object} user - User object that may contain profilePictureUrl
 * @param {string} [fallbackInitial='U'] - Initial to use in fallback avatar
 * @param {number} [size=40] - Size of the avatar in pixels
 */
export const getProfilePictureUrl = (user, fallbackInitial = 'U', size = 40) => {
  if (user?.profilePictureUrl) {
    return user.profilePictureUrl;
  }
  
  // Extract initial from user if possible
  const initial = user?.name?.charAt(0) || fallbackInitial;
  
  // Generate SVG placeholder with user's initial
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Crect width='${size}' height='${size}' fill='%234a6da7'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='${size * 0.4}' fill='white' text-anchor='middle' dy='.3em'%3E${initial}%3C/text%3E%3C/svg%3E`;
};