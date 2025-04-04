// API base URL configuration based on environment
export const API_BASE_URL = process.env.RSBUILD_API_URL || '/api';

// Helper function to construct API URLs
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
}; 