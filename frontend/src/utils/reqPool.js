export const requestPool = {
  activeRequests: {},
  
  /**
   * Execute a request with pooling to prevent duplicate requests
   * @param {string} key - Unique identifier for the request
   * @param {Function} requestFn - Function that returns a Promise for the request
   * @returns {Promise} - The pooled request promise
   */
  execute(key, requestFn) {
    // If this request is already in flight, return the existing promise
    if (this.activeRequests[key]) {
      //console.log(`Using pooled request for: ${key}`);
      return this.activeRequests[key].promise;
    }
    
    // Create new request and track it
    //console.log(`Creating new pooled request for: ${key}`);
    const promise = requestFn();
    
    // Track the request
    this.activeRequests[key] = { 
      promise,
      timestamp: Date.now()
    };
    
    // Clean up the request reference when done
    promise.finally(() => {
      setTimeout(() => {
        delete this.activeRequests[key];
      }, 1000); // Keep in pool for 1 second in case of rapid repeated calls
    });
    
    return promise;
  }
};