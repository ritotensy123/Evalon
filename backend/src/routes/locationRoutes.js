const express = require('express');
const axios = require('axios');
const router = express.Router();
const { logger } = require('../utils/logger');

// CountryStateCity API configuration
const CSC_API_KEY = 'aFZ4Q2ttOXA4TU5PY2FNWUZpNmxmNUhnYTRlNHprVXJHb291Vk9GZQ==';
const CSC_BASE_URL = 'https://api.countrystatecity.in/v1';

// Axios instance for CountryStateCity API
const cscApi = axios.create({
  baseURL: CSC_BASE_URL,
  timeout: 10000,
  headers: {
    'X-CSCAPI-KEY': CSC_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Get all countries
router.get('/countries', async (req, res) => {
  try {
    logger.info('[LOCATION] Fetching countries from CountryStateCity API');
    
    const response = await cscApi.get('/countries');
    const countries = response.data;
    
    // Transform the data to match our expected format
    const transformedCountries = countries.map(country => ({
      code: country.iso2,
      name: country.name,
      phoneCode: country.phonecode,
      currency: country.currency,
      currencySymbol: country.currency_symbol
    }));
    
    logger.info('[LOCATION] Successfully fetched countries', { count: transformedCountries.length });
    res.json({
      success: true,
      message: 'Countries fetched successfully',
      data: transformedCountries
    });
    
  } catch (error) {
    logger.error('[LOCATION] Error fetching countries', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
});

// Get states by country (alternative route format)
router.get('/countries/:countryCode/states', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    logger.info('[LOCATION] Fetching states for country', { countryCode });
    
    const response = await cscApi.get(`/countries/${countryCode}/states`);
    const states = response.data;
    
    // Transform the data to match our expected format
    const transformedStates = states.map(state => ({
      code: state.iso2,
      name: state.name,
      countryCode: state.country_code
    }));
    
    logger.info('[LOCATION] Successfully fetched states', { count: transformedStates.length, countryCode });
    res.json({
      success: true,
      message: `States for ${countryCode} fetched successfully`,
      data: transformedStates
    });
    
  } catch (error) {
    logger.error('[LOCATION] Error fetching states', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
});

// Get states by country (original route format)
router.get('/states/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    logger.info('[LOCATION] Fetching states for country', { countryCode });
    
    const response = await cscApi.get(`/countries/${countryCode}/states`);
    const states = response.data;
    
    // Transform the data to match our expected format
    const transformedStates = states.map(state => ({
      code: state.iso2,
      name: state.name,
      countryCode: state.country_code
    }));
    
    logger.info('[LOCATION] Successfully fetched states', { count: transformedStates.length, countryCode });
    res.json({
      success: true,
      message: `States for ${countryCode} fetched successfully`,
      data: transformedStates
    });
    
  } catch (error) {
    logger.error('[LOCATION] Error fetching states', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
});

// Get cities by state (new route format)
router.get('/countries/:countryCode/states/:stateCode/cities', async (req, res) => {
  try {
    const { countryCode, stateCode } = req.params;
    
    console.log(`🌍 Fetching cities for state: ${stateCode}, country: ${countryCode}`);
    
    const response = await cscApi.get(`/countries/${countryCode}/states/${stateCode}/cities`);
    const cities = response.data;
    
    // Transform the data to match our expected format
    const transformedCities = cities.map(city => ({
      name: city.name,
      stateCode: city.state_code,
      countryCode: city.country_code
    }));
    
    console.log(`✅ Successfully fetched ${transformedCities.length} cities for ${stateCode}, ${countryCode}`);
    res.json({
      success: true,
      message: `Cities for ${stateCode}, ${countryCode} fetched successfully`,
      data: transformedCities
    });
    
  } catch (error) {
    console.error('❌ Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// Get cities by state (original route format)
router.get('/cities/:countryCode/:stateCode', async (req, res) => {
  try {
    const { countryCode, stateCode } = req.params;
    
    console.log(`🌍 Fetching cities for state: ${stateCode}, country: ${countryCode}`);
    
    const response = await cscApi.get(`/countries/${countryCode}/states/${stateCode}/cities`);
    const cities = response.data;
    
    // Transform the data to match our expected format
    const transformedCities = cities.map(city => ({
      name: city.name,
      stateCode: city.state_code,
      countryCode: city.country_code
    }));
    
    console.log(`✅ Successfully fetched ${transformedCities.length} cities for ${stateCode}, ${countryCode}`);
    res.json({
      success: true,
      message: `Cities for ${stateCode}, ${countryCode} fetched successfully`,
      data: transformedCities
    });
    
  } catch (error) {
    console.error('❌ Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// Get country details
router.get('/countries/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    console.log(`🌍 Fetching country details for: ${countryCode}`);
    
    const response = await cscApi.get(`/countries/${countryCode}`);
    const country = response.data;
    
    // Transform the data to match our expected format
    const transformedCountry = {
      code: country.iso2,
      name: country.name,
      phoneCode: country.phonecode,
      currency: country.currency,
      currencySymbol: country.currency_symbol
    };
    
    console.log(`✅ Successfully fetched country details for ${countryCode}`);
    res.json({
      success: true,
      message: `Country details for ${countryCode} fetched successfully`,
      data: transformedCountry
    });
    
  } catch (error) {
    console.error('❌ Error fetching country details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country details',
      error: error.message
    });
  }
});

module.exports = router;
