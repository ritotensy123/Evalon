const express = require('express');
const router = express.Router();
const countryStateCityService = require('../services/countryStateCityService');

/**
 * @route GET /api/locations/countries
 * @desc Get all countries
 * @access Public
 */
router.get('/countries', async (req, res) => {
  try {
    const result = await countryStateCityService.getCountries();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Countries fetched successfully',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch countries',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /countries route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route GET /api/locations/countries/:countryCode/states
 * @desc Get states by country code
 * @access Public
 */
router.get('/countries/:countryCode/states', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }
    
    const result = await countryStateCityService.getStatesByCountry(countryCode);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `States for ${countryCode} fetched successfully`,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to fetch states for ${countryCode}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /states route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route GET /api/locations/countries/:countryCode/states/:stateCode/cities
 * @desc Get cities by country code and state code
 * @access Public
 */
router.get('/countries/:countryCode/states/:stateCode/cities', async (req, res) => {
  try {
    const { countryCode, stateCode } = req.params;
    
    if (!countryCode || !stateCode) {
      return res.status(400).json({
        success: false,
        message: 'Both country code and state code are required'
      });
    }
    
    const result = await countryStateCityService.getCitiesByState(countryCode, stateCode);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Cities for ${stateCode}, ${countryCode} fetched successfully`,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to fetch cities for ${stateCode}, ${countryCode}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /cities route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

/**
 * @route GET /api/locations/countries/:countryCode
 * @desc Get country details by country code
 * @access Public
 */
router.get('/countries/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }
    
    const result = await countryStateCityService.getCountryByCode(countryCode);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Country details for ${countryCode} fetched successfully`,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to fetch country details for ${countryCode}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /country route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;

