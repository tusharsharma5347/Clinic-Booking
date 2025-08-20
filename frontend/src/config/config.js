// Configuration file for environment-specific settings
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    environment: 'development'
  },
  production: {
    apiBaseUrl: process.env.REACT_APP_API_URL || '/api',
    environment: 'production'
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Export configuration for current environment
export default config[env];
