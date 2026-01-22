# Location API Documentation

## Overview
The Location API provides dynamic country, state, and city data using the CountryStateCity API service. This replaces the hardcoded location data with real-time, comprehensive location information.

## API Endpoints

### Get All Countries
```
GET /api/locations/countries
```

**Response:**
```json
{
  "success": true,
  "message": "Countries fetched successfully",
  "data": [
    {
      "code": "IN",
      "name": "India",
      "phonecode": "+91",
      "currency": "INR",
      "currency_symbol": "₹"
    },
    {
      "code": "US",
      "name": "United States",
      "phonecode": "+1",
      "currency": "USD",
      "currency_symbol": "$"
    }
  ]
}
```

### Get States by Country
```
GET /api/locations/countries/{countryCode}/states
```

**Parameters:**
- `countryCode` (string): ISO2 country code (e.g., 'IN', 'US')

**Response:**
```json
{
  "success": true,
  "message": "States for IN fetched successfully",
  "data": [
    {
      "code": "MH",
      "name": "Maharashtra",
      "country_code": "IN"
    },
    {
      "code": "KA",
      "name": "Karnataka",
      "country_code": "IN"
    }
  ]
}
```

### Get Cities by State
```
GET /api/locations/countries/{countryCode}/states/{stateCode}/cities
```

**Parameters:**
- `countryCode` (string): ISO2 country code
- `stateCode` (string): ISO2 state code

**Response:**
```json
{
  "success": true,
  "message": "Cities for MH, IN fetched successfully",
  "data": [
    {
      "name": "Mumbai",
      "state_code": "MH",
      "country_code": "IN"
    },
    {
      "name": "Pune",
      "state_code": "MH",
      "country_code": "IN"
    }
  ]
}
```

### Get Country Details
```
GET /api/locations/countries/{countryCode}
```

**Parameters:**
- `countryCode` (string): ISO2 country code

**Response:**
```json
{
  "success": true,
  "message": "Country details for IN fetched successfully",
  "data": {
    "code": "IN",
    "name": "India",
    "phonecode": "+91",
    "currency": "INR",
    "currency_symbol": "₹"
  }
}
```

## Frontend Integration

### API Service Usage
```javascript
import { locationAPI } from '../services/api';

// Fetch countries
const countries = await locationAPI.getCountries();

// Fetch states for a country
const states = await locationAPI.getStatesByCountry('IN');

// Fetch cities for a state
const cities = await locationAPI.getCitiesByState('IN', 'MH');
```

### Form Integration
The organization registration form now uses dynamic location data:

1. **Countries**: Loaded automatically on component mount
2. **States**: Loaded when a country is selected
3. **Cities**: Loaded when a state is selected

### Loading States
- Loading indicators are shown while fetching data
- Error handling with user-friendly messages
- Automatic form field resets when parent selection changes

## Backend Service

### CountryStateCity Service
Located at: `src/services/countryStateCityService.js`

**Features:**
- Axios-based HTTP client with proper headers
- Error handling and logging
- Data transformation for consistent format
- 10-second timeout for API calls

### API Key Configuration
The API key is configured in the service:
```javascript
const CSC_API_KEY = 'aFZ4Q2ttOXA4TU5PY2FNWUZpNmxmNUhnYTRlNHprVXJHb291Vk9GZQ==';
```

## Error Handling

### Backend Errors
- Network timeouts (10 seconds)
- API rate limiting
- Invalid country/state codes
- Service unavailability

### Frontend Errors
- Loading state management
- Error message display
- Graceful fallbacks
- User-friendly error messages

## Benefits

1. **Comprehensive Data**: Access to all countries, states, and cities worldwide
2. **Real-time Updates**: Data is always current from the API
3. **Consistent Format**: Standardized data structure across all endpoints
4. **Better UX**: Loading states and error handling
5. **Scalable**: No need to maintain hardcoded location data

## Testing

### Manual Testing
1. Start the backend server
2. Navigate to organization registration
3. Test country selection (should load all countries)
4. Test state selection (should load states for selected country)
5. Test city selection (should load cities for selected state)

### API Testing
```bash
# Test countries endpoint
curl http://localhost:5001/api/locations/countries

# Test states endpoint
curl http://localhost:5001/api/locations/countries/IN/states

# Test cities endpoint
curl http://localhost:5001/api/locations/countries/IN/states/MH/cities
```

## Future Enhancements

1. **Caching**: Implement Redis caching for frequently accessed data
2. **Search**: Add search functionality for large city lists
3. **Pagination**: Implement pagination for cities with many results
4. **Offline Support**: Cache data for offline usage
5. **Analytics**: Track most selected locations for optimization

