/**
 * Centralized Data Refresh Utility
 *
 * This utility provides consistent data refresh patterns across the application
 * to ensure UI always displays the latest data after CRUD operations
 */

import { supabase } from '../lib/supabase';

/**
 * Setup realtime subscription for a table
 * @param {string} table - Table name to subscribe to
 * @param {Function} onUpdate - Callback function when data changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export const subscribeToTable = (table, onUpdate) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: table
      },
      (payload) => {
        console.log(`[Realtime] ${table} changed:`, payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

/**
 * Create a refresh handler that automatically refetches data after mutations
 * @param {Function} fetchFunction - Function to fetch data
 * @param {Function} setStateFunction - Function to update state
 * @returns {Object} Object with CRUD wrapper functions
 */
export const createRefreshHandler = (fetchFunction, setStateFunction) => {
  const refresh = async () => {
    try {
      const data = await fetchFunction();
      setStateFunction(data);
      return data;
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  return {
    refresh,

    /**
     * Wrapper for add operations that auto-refreshes
     */
    withAddRefresh: async (addFunction, ...args) => {
      const result = await addFunction(...args);
      await refresh();
      return result;
    },

    /**
     * Wrapper for update operations that auto-refreshes
     */
    withUpdateRefresh: async (updateFunction, ...args) => {
      const result = await updateFunction(...args);
      await refresh();
      return result;
    },

    /**
     * Wrapper for delete operations that auto-refreshes
     */
    withDeleteRefresh: async (deleteFunction, ...args) => {
      const result = await deleteFunction(...args);
      await refresh();
      return result;
    }
  };
};

/**
 * Debounced refresh to avoid multiple rapid refreshes
 * @param {Function} refreshFunction - Function to call
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {Function} Debounced function
 */
export const debounceRefresh = (refreshFunction, delay = 300) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      refreshFunction(...args);
    }, delay);
  };
};

/**
 * Setup automatic refresh intervals
 * @param {Function} refreshFunction - Function to call periodically
 * @param {number} interval - Interval in milliseconds (default 30000ms = 30s)
 * @returns {Function} Cleanup function to stop interval
 */
export const setupAutoRefresh = (refreshFunction, interval = 30000) => {
  const intervalId = setInterval(refreshFunction, interval);

  return () => {
    clearInterval(intervalId);
  };
};

/**
 * Optimistic update helper - updates UI immediately then syncs with server
 * @param {Function} setState - State setter function
 * @param {Function} updateFunction - Function that performs the update
 * @param {Function} rollbackFunction - Function to rollback if update fails
 * @returns {Function} Update handler
 */
export const withOptimisticUpdate = (setState, updateFunction, rollbackFunction) => {
  return async (optimisticData) => {
    // Apply optimistic update immediately
    setState(optimisticData);

    try {
      // Perform actual update
      await updateFunction(optimisticData);
    } catch (error) {
      // Rollback on error
      console.error('Optimistic update failed, rolling back:', error);
      if (rollbackFunction) {
        await rollbackFunction();
      }
      throw error;
    }
  };
};

/**
 * Batch refresh multiple data sources
 * @param {Array<Function>} refreshFunctions - Array of refresh functions
 * @returns {Promise} Promise that resolves when all refreshes complete
 */
export const batchRefresh = async (refreshFunctions) => {
  try {
    await Promise.all(refreshFunctions.map(fn => fn()));
  } catch (error) {
    console.error('Error in batch refresh:', error);
    throw error;
  }
};

/**
 * Cache helper to avoid unnecessary refreshes
 */
export class DataCache {
  constructor(ttl = 60000) { // Default TTL: 1 minute
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const value = this.get(key);
    return value !== null;
  }
}

/**
 * Hook-style refresh manager for React components
 */
export const createRefreshManager = () => {
  const subscriptions = [];
  const intervals = [];

  const addSubscription = (subscription) => {
    subscriptions.push(subscription);
  };

  const addInterval = (cleanup) => {
    intervals.push(cleanup);
  };

  const cleanup = () => {
    subscriptions.forEach(sub => sub.unsubscribe());
    intervals.forEach(cleanup => cleanup());
    subscriptions.length = 0;
    intervals.length = 0;
  };

  return {
    addSubscription,
    addInterval,
    cleanup
  };
};

/**
 * Enhanced refresh with error handling and retries
 * @param {Function} fetchFunction - Function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Promise} Promise that resolves with data or rejects with error
 */
export const robustRefresh = async (
  fetchFunction,
  options = { maxRetries: 3, retryDelay: 1000, onError: null }
) => {
  const { maxRetries, retryDelay, onError } = options;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await fetchFunction();
      return data;
    } catch (error) {
      lastError = error;
      console.error(`Refresh attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // All retries failed
  if (onError) {
    onError(lastError);
  }
  throw lastError;
};

export default {
  subscribeToTable,
  createRefreshHandler,
  debounceRefresh,
  setupAutoRefresh,
  withOptimisticUpdate,
  batchRefresh,
  DataCache,
  createRefreshManager,
  robustRefresh
};
