/**
 * API configuration for handling both local and production environments
 */

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Base API URLs
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000' 
  : 'https://inksight-backend.onrender.com'; // Update this with your actual Render URL once deployed

/**
 * Wrapper for fetch API with common configuration
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Common API functions
 */
export const api = {
  // Patient endpoints
  async getPatients() {
    return fetchApi('/patients');
  },
  
  async getPatientById(patientId) {
    return fetchApi(`/patient/${patientId}`);
  },
  
  async submitPatient(patientData) {
    return fetchApi('/submit-patient', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },
  
  async updatePatientResponses(patientId, responsesData) {
    return fetchApi(`/patient/${patientId}/responses`, {
      method: 'PUT',
      body: JSON.stringify(responsesData),
    });
  },
  
  // Response analysis
  async analyzeResponse(responseText, imageId) {
    return fetchApi('/analyze-response', {
      method: 'POST',
      body: JSON.stringify({
        response_text: responseText,
        image_id: imageId
      }),
    });
  },
  
  // Tables info
  async getTablesInfo() {
    return fetchApi('/tables-info');
  }
}; 