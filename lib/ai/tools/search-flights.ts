import { tool } from 'ai';
import { z } from 'zod';
import { serpApiService, findAirportCode } from '@/lib/services/serpapi';

// Helper function to convert travel class string to number
function convertTravelClass(travelClass: 'economy' | 'premium_economy' | 'business' | 'first'): 1 | 2 | 3 | 4 {
  switch (travelClass) {
    case 'economy': return 1;
    case 'premium_economy': return 2;
    case 'business': return 3;
    case 'first': return 4;
  }
}

// Simple date validation - expects the LLM to provide proper YYYY-MM-DD dates
function validateDate(dateInput: string): string | null {
  // Only accept YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return null;
  }

  const date = new Date(dateInput + 'T12:00:00');
  if (isNaN(date.getTime())) {
    return null;
  }

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return null; // Let the LLM handle past dates by asking for clarification
  }

  return dateInput;
}

export const searchFlights = tool({
  description: 'Search for flights between airports using real-time flight data. Automatically converts city names to airport codes. IMPORTANT: Only use future dates in YYYY-MM-DD format.',
  parameters: z.object({
    origin: z.string().describe('Origin city or airport code (e.g., "San Francisco", "SFO", "New York")'),
    destination: z.string().describe('Destination city or airport code (e.g., "Tokyo", "NRT", "London")'),
    departureDate: z.string().describe('Departure date in YYYY-MM-DD format (e.g., "2025-12-25"). Must be a future date.'),
    returnDate: z.string().optional().describe('Return date in YYYY-MM-DD format for round-trip flights. Must be after departure date.'),
    passengers: z.number().optional().describe('Number of adult passengers (defaults to 1)'),
    travelClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional().describe('Travel class preference (defaults to economy)'),
  }),
  execute: async ({ origin, destination, departureDate, returnDate, passengers, travelClass }) => {
    try {
      // Validate and normalize airport codes
      const originCode = findAirportCode(origin);
      const destinationCode = findAirportCode(destination);

      if (!originCode) {
        return {
          error: `Could not find airport for "${origin}". Please provide a valid city name or 3-letter airport code.`,
          suggestions: 'Try cities like "New York", "Los Angeles", or airport codes like "JFK", "LAX".'
        };
      }

      if (!destinationCode) {
        return {
          error: `Could not find airport for "${destination}". Please provide a valid city name or 3-letter airport code.`,
          suggestions: 'Try cities like "London", "Tokyo", or airport codes like "LHR", "NRT".'
        };
      }

      // Validate dates (expect LLM to provide YYYY-MM-DD format)
      const validatedDepartureDate = validateDate(departureDate);
      if (!validatedDepartureDate) {
        return {
          error: `Invalid departure date "${departureDate}". Please provide a future date in YYYY-MM-DD format.`,
          suggestions: 'The date must be in the format YYYY-MM-DD and cannot be in the past.'
        };
      }

      let validatedReturnDate: string | undefined;
      if (returnDate) {
        const validatedReturn = validateDate(returnDate);
        if (!validatedReturn) {
          return {
            error: `Invalid return date "${returnDate}". Please provide a future date in YYYY-MM-DD format.`,
            suggestions: 'The date must be in the format YYYY-MM-DD and cannot be in the past.'
          };
        }
        validatedReturnDate = validatedReturn;
      }

      // Note: Date validation is handled in parseDate() function which automatically
      // adjusts past dates to next year, so we don't need to check here

      // Check if return date is after departure date
      if (validatedReturnDate) {
        const departureDateTime = new Date(validatedDepartureDate);
        const returnDateTime = new Date(validatedReturnDate);
        if (returnDateTime <= departureDateTime) {
          return {
            error: `Return date "${returnDate}" must be after departure date "${departureDate}".`,
            suggestions: 'Make sure your return date is later than your departure date.'
          };
        }
      }

      // Check if API key is properly configured
      if (!process.env.SERPAPI_KEY || process.env.SERPAPI_KEY === 'your_serpapi_key_here') {
        return {
          error: 'Flight search is not configured. SerpApi API key is missing.',
          details: 'Please set SERPAPI_KEY in your .env.local file',
          suggestions: `
🔧 **Setup Instructions:**
1. Create a .env.local file in your project root
2. Add: SERPAPI_KEY=your_actual_api_key_here
3. Get your free API key from https://serpapi.com/dashboard
4. Free tier includes 100 searches per month

**Example search parameters detected:**
- Route: ${origin} (${originCode}) → ${destination} (${destinationCode})
- Date: ${departureDate}${returnDate ? ` - ${returnDate}` : ''}
- Passengers: ${passengers || 1} ${travelClass || 'economy'}
- Trip Type: ${returnDate ? 'round-trip' : 'one-way'}

Once configured, I'll be able to search real flights with pricing!`
        };
      }

      // Search flights using SerpApi
      const searchParams = {
        departure_id: originCode,
        arrival_id: destinationCode,
        outbound_date: validatedDepartureDate,
        ...(validatedReturnDate && { return_date: validatedReturnDate }),
        ...(travelClass && { travel_class: convertTravelClass(travelClass) }),
        ...(passengers && passengers > 0 && { adults: passengers }),
        type: (validatedReturnDate ? 1 : 2) as 1 | 2, // 1 = round-trip, 2 = one-way
      };

      const flightResults = await serpApiService.searchFlights(searchParams);

      // Increment API usage counter (client-side will handle this)
      // This is a simple approach for MVP - in production you'd track this server-side

      // Format response for AI
      return {
        success: true,
        searchParameters: {
          origin: `${origin} (${originCode})`,
          destination: `${destination} (${destinationCode})`,
          departureDate: validatedDepartureDate,
          returnDate: validatedReturnDate,
          passengers: passengers || 1,
          travelClass: travelClass || 'economy',
          tripType: validatedReturnDate ? 'round-trip' : 'one-way',
        },
        priceInsights: flightResults.price_insights,
        bestFlights: flightResults.best_flights?.slice(0, 3), // Limit to top 3
        otherFlights: flightResults.other_flights?.slice(0, 5), // Limit to top 5
        totalResults: (flightResults.best_flights?.length || 0) + (flightResults.other_flights?.length || 0),
        searchUrl: flightResults.search_metadata.google_flights_url,
      };
    } catch (error) {
      console.error('Flight search error:', error);
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message.includes('SERPAPI_KEY')) {
        return {
          error: 'Flight search is not configured properly. Please contact support.',
          details: 'SerpApi API key is missing or invalid',
          suggestions: 'The administrator needs to set up the SERPAPI_KEY environment variable.'
        };
      }
      
      // Check if it's a 400 error (bad request)
      if (error instanceof Error && error.message.includes('400')) {
        return {
          error: 'Invalid flight search parameters. Please check your search criteria.',
          details: error.message,
          suggestions: 'Try searching with different cities, valid dates (YYYY-MM-DD format), or check airport codes.'
        };
      }
      
      return {
        error: 'Sorry, I encountered an error while searching for flights. Please try again or check your search parameters.',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}); 