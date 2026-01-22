/**
 * AI Model Service
 * Handles communication with the Python AI service for model management
 * (training, publishing, switching, deleting models)
 */

import { AI_SERVICE_URL as CONFIG_AI_URL } from '../config/apiConfig';

// Dynamic port detection - tries ports 5002-5012 (for development flexibility)
let AI_SERVICE_URL = CONFIG_AI_URL;

// Extract base URL without port for dynamic port scanning
const getBaseUrl = () => {
  try {
    const url = new URL(CONFIG_AI_URL);
    return `${url.protocol}//${url.hostname}`;
  } catch (error) {
    throw new Error(`Invalid AI_SERVICE_URL in config: ${CONFIG_AI_URL}. Please check your environment variables.`);
  }
};

// Function to find the correct port (for development with dynamic port allocation)
async function findServicePort() {
  const baseUrl = getBaseUrl();
  
  // Try default port from config first, then scan range
  let defaultPort;
  try {
    defaultPort = parseInt(new URL(CONFIG_AI_URL).port);
  } catch {
    throw new Error(`Cannot extract port from AI_SERVICE_URL: ${CONFIG_AI_URL}`);
  }
  
  // If no port in URL, throw error (production should have explicit port)
  if (!defaultPort || isNaN(defaultPort)) {
    throw new Error(`AI_SERVICE_URL must include a port number: ${CONFIG_AI_URL}`);
  }
  
  // For development: scan nearby ports if default fails
  const portsToTry = [defaultPort, ...Array.from({ length: 11 }, (_, i) => defaultPort + i - 5).filter(p => p !== defaultPort && p > 0)];
  
  for (const port of portsToTry) {
    try {
      const response = await fetch(`${baseUrl}:${port}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        AI_SERVICE_URL = `${baseUrl}:${port}`;
        console.log(`✅ AI Service found on port ${port}`);
        return port;
      }
    } catch (error) {
      // Continue to next port
    }
  }
  return null;
}

class AIModelService {
  static servicePort = null;
  
  /**
   * Get authorization headers for authenticated requests
   */
  static getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
  
  /**
   * Initialize service and find correct port
   */
  static async initialize() {
    if (!this.servicePort) {
      this.servicePort = await findServicePort();
    }
    return this.servicePort !== null;
  }
  
  /**
   * Get all models
   * @returns {Promise<Object>} Response with models array and activeModelId
   */
  static async getAllModels() {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      // Return empty models array if service is not available
      return {
        success: false,
        models: [],
        activeModelId: null,
        error: error.message
      };
    }
  }
  
  /**
   * Start training a new model
   * @param {Object} config - Training configuration
   * @param {string} config.name - Model name
   * @param {string} config.description - Model description
   * @param {Object} config.trainingConfig - Training parameters (epochs, batchSize, etc.)
   * @returns {Promise<Object>} Response with modelId
   */
  static async startTraining(config) {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models/train`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          training_config: config.trainingConfig,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to start training: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error starting training:', error);
      throw error;
    }
  }
  
  /**
   * Get training progress for a model
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Response with progress information
   */
  static async getTrainingProgress(modelId) {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models/${modelId}/progress`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch training progress: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching training progress:', error);
      throw error;
    }
  }
  
  /**
   * Publish a trained model (make it active)
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Response with success status
   */
  static async publishModel(modelId) {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models/${modelId}/publish`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to publish model: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error publishing model:', error);
      throw error;
    }
  }
  
  /**
   * Switch to a different active model
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Response with success status
   */
  static async switchModel(modelId) {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models/${modelId}/switch`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to switch model: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error switching model:', error);
      throw error;
    }
  }
  
  /**
   * Delete a model
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Response with success status
   */
  static async deleteModel(modelId) {
    try {
      await this.initialize();
      
      const response = await fetch(`${AI_SERVICE_URL}/api/models/${modelId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to delete model: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }
}

export default AIModelService;

