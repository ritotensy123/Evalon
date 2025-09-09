const axios = require('axios');

// CountryStateCity API configuration
const CSC_API_BASE_URL = 'https://api.countrystatecity.in/v1';
const CSC_API_KEY = 'aFZ4Q2ttOXA4TU5PY2FNWUZpNmxmNUhnYTRlNHprVXJHb291Vk9GZQ==';

// Create axios instance with default headers
const cscApi = axios.create({
  baseURL: CSC_API_BASE_URL,
  headers: {
    'X-CSCAPI-KEY': CSC_API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

/**
 * Get all countries
 * @returns {Promise<Array>} Array of countries
 */
const getCountries = async () => {
  try {
    console.log('🌍 Fetching countries from CountryStateCity API...');
    const response = await cscApi.get('/countries');
    
    // Transform the data to a more usable format
    const countries = response.data.map(country => ({
      code: country.iso2,
      name: country.name,
      phonecode: country.phonecode,
      currency: country.currency,
      currency_symbol: country.currency_symbol
    }));
    
    console.log(`✅ Successfully fetched ${countries.length} countries`);
    return {
      success: true,
      data: countries
    };
  } catch (error) {
    console.error('❌ Error fetching countries:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get states by country code
 * @param {string} countryCode - ISO2 country code (e.g., 'IN', 'US')
 * @returns {Promise<Array>} Array of states
 */
const getStatesByCountry = async (countryCode) => {
  try {
    if (!countryCode) {
      throw new Error('Country code is required');
    }
    
    console.log(`🏛️ Fetching states for country: ${countryCode}`);
    const response = await cscApi.get(`/countries/${countryCode}/states`);
    
    // Transform the data to a more usable format
    const states = response.data.map(state => ({
      code: state.iso2,
      name: state.name,
      country_code: state.country_code
    }));
    
    console.log(`✅ Successfully fetched ${states.length} states for ${countryCode}`);
    return {
      success: true,
      data: states
    };
  } catch (error) {
    console.error(`❌ Error fetching states for ${countryCode}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get cities by country code and state code
 * @param {string} countryCode - ISO2 country code (e.g., 'IN', 'US')
 * @param {string} stateCode - ISO2 state code (e.g., 'MH', 'CA')
 * @returns {Promise<Array>} Array of cities
 */
const getCitiesByState = async (countryCode, stateCode) => {
  try {
    if (!countryCode || !stateCode) {
      throw new Error('Both country code and state code are required');
    }
    
    console.log(`🏙️ Fetching cities for ${stateCode}, ${countryCode}`);
    const response = await cscApi.get(`/countries/${countryCode}/states/${stateCode}/cities`);
    
    // Transform the data to a more usable format
    const cities = response.data.map(city => ({
      name: city.name,
      state_code: city.state_code,
      country_code: city.country_code
    }));
    
    console.log(`✅ Successfully fetched ${cities.length} cities for ${stateCode}, ${countryCode}`);
    return {
      success: true,
      data: cities
    };
  } catch (error) {
    console.error(`❌ Error fetching cities for ${stateCode}, ${countryCode}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get country details by country code
 * @param {string} countryCode - ISO2 country code
 * @returns {Promise<Object>} Country details
 */
const getCountryByCode = async (countryCode) => {
  try {
    if (!countryCode) {
      throw new Error('Country code is required');
    }
    
    console.log(`🔍 Fetching country details for: ${countryCode}`);
    const response = await cscApi.get(`/countries/${countryCode}`);
    
    const country = {
      code: response.data.iso2,
      name: response.data.name,
      phonecode: response.data.phonecode,
      currency: response.data.currency,
      currency_symbol: response.data.currency_symbol
    };
    
    console.log(`✅ Successfully fetched country details for ${countryCode}`);
    return {
      success: true,
      data: country
    };
  } catch (error) {
    console.error(`❌ Error fetching country details for ${countryCode}:`, error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

module.exports = {
  getCountries,
  getStatesByCountry,
  getCitiesByState,
  getCountryByCode
};

