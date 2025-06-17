import { z } from 'zod';

// SerpApi flight segment schema (individual flight leg)
export const FlightSegmentSchema = z.object({
  departure_airport: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    time: z.string().optional(),
  }).optional(),
  arrival_airport: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    time: z.string().optional(),
  }).optional(),
  duration: z.number().optional(),
  airplane: z.string().optional(),
  airline: z.string().optional(),
  airline_logo: z.string().optional(),
  travel_class: z.string().optional(),
  flight_number: z.string().optional(),
  legroom: z.string().optional(),
  extensions: z.array(z.string()).optional(),
  often_delayed_by_over: z.string().optional(),
  overnight: z.boolean().optional(),
}).passthrough();

// SerpApi flight option schema (contains multiple flight segments)
export const FlightSchema = z.object({
  // Main flight info
  flights: z.array(FlightSegmentSchema).optional(), // Array of flight segments
  price: z.number().optional(),
  total_duration: z.number().optional(),
  type: z.string().optional(), // "Round trip", "One way"
  airline_logo: z.string().optional(),
  carbon_emissions: z.object({
    this_flight: z.number().optional(),
    typical_for_this_route: z.number().optional(),
    difference_percent: z.number().optional(),
  }).optional(),
  departure_token: z.string().optional(),
  
  // Legacy fields for backwards compatibility
  departure_airport: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    time: z.string().optional(),
  }).optional(),
  arrival_airport: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    time: z.string().optional(),
  }).optional(),
  duration: z.number().optional(),
  airplane: z.string().optional(),
  airline: z.string().optional(),
  travel_class: z.string().optional(),
  flight_number: z.string().optional(),
  legroom: z.string().optional(),
  extensions: z.array(z.string()).optional(),
  often_delayed_by_over: z.string().optional(),
}).passthrough(); // Allow additional fields

export const FlightSearchResultSchema = z.object({
  best_flights: z.array(FlightSchema).optional(),
  other_flights: z.array(FlightSchema).optional(),
  price_insights: z.object({
    lowest_price: z.number().optional(),
    price_level: z.string().optional(), // "low", "typical", "high"
    typical_price_range: z.array(z.number()).optional(),
    // Handle both array of objects AND array of arrays (SerpApi inconsistency)
    price_history: z.union([
      z.array(z.object({
        date: z.string(),
        price: z.number(),
      })),
      z.array(z.array(z.any())), // Handle array of arrays
      z.any(), // Fallback for any other structure
    ]).optional(),
  }).optional(),
  search_metadata: z.object({
    id: z.string().optional(),
    status: z.string().optional(),
    json_endpoint: z.string().optional(),
    created_at: z.string().optional(),
    processed_at: z.string().optional(),
    google_flights_url: z.string().optional(),
    total_time_taken: z.number().optional(),
  }).optional(),
  search_parameters: z.object({
    engine: z.string().optional(),
    departure_id: z.string().optional(),
    arrival_id: z.string().optional(),
    outbound_date: z.string().optional(),
    return_date: z.string().optional(),
    travel_class: z.union([z.string(), z.number()]).optional(),
    adults: z.number().optional(),
  }).optional(),
}).passthrough(); // Allow additional fields from SerpApi

export type FlightSearchResult = z.infer<typeof FlightSearchResultSchema>;
export type Flight = z.infer<typeof FlightSchema>;
export type FlightSegment = z.infer<typeof FlightSegmentSchema>;

export interface FlightSearchParams {
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  return_date?: string;
  travel_class?: 1 | 2 | 3 | 4; // 1: Economy, 2: Premium economy, 3: Business, 4: First
  adults?: number;
  children?: number;
  infants_in_seat?: number;
  infants_on_lap?: number;
  type?: 1 | 2 | 3; // 1: round-trip, 2: one-way, 3: multi-city
}

// Common airport codes for quick reference
export const COMMON_AIRPORTS = {
  // North America
  'new york': ['JFK', 'LGA', 'EWR'],
  'nyc': ['JFK', 'LGA', 'EWR'],
  'los angeles': ['LAX'],
  'la': ['LAX'],
  'chicago': ['ORD', 'MDW'],
  'san francisco': ['SFO'],
  'sf': ['SFO'],
  'miami': ['MIA'],
  'boston': ['BOS'],
  'seattle': ['SEA'],
  'denver': ['DEN'],
  'atlanta': ['ATL'],
  'dallas': ['DFW', 'DAL'],
  'washington': ['DCA', 'IAD', 'BWI'],
  'dc': ['DCA', 'IAD', 'BWI'],

  // Europe
  'london': ['LHR', 'LGW', 'STN', 'LTN'],
  'paris': ['CDG', 'ORY'],
  'amsterdam': ['AMS'],
  'frankfurt': ['FRA'],
  'madrid': ['MAD'],
  'rome': ['FCO', 'CIA'],
  'barcelona': ['BCN'],
  'berlin': ['BER'],
  'zurich': ['ZUR'],
  'vienna': ['VIE'],

  // Asia
  'tokyo': ['NRT', 'HND'],
  'beijing': ['PEK', 'PKX'],
  'shanghai': ['PVG', 'SHA'],
  'hong kong': ['HKG'],
  'singapore': ['SIN'],
  'dubai': ['DXB'],
  'mumbai': ['BOM'],
  'delhi': ['DEL'],
  'bangkok': ['BKK'],
  'seoul': ['ICN', 'GMP'],
  'kuala lumpur': ['KUL'],
  'melbourne': ['MEL'],
  'sydney': ['SYD'],
};

export function findAirportCode(input: string): string | null {
  const normalized = input.toLowerCase().trim();

  // Check if it's already a valid airport code
  if (/^[A-Z]{3}$/.test(input.toUpperCase())) {
    return input.toUpperCase();
  }

  // Check common airports mapping
  for (const [city, codes] of Object.entries(COMMON_AIRPORTS)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return codes[0]; // Return primary airport
    }
  }

  return null;
}

class SerpApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY!;
    this.baseUrl = 'https://serpapi.com/search.json';

    if (!this.apiKey || this.apiKey === 'your_serpapi_key_here') {
      console.error('SerpApi Error: Invalid or missing API key');
      console.log('Please set SERPAPI_KEY in your .env.local file');
      console.log('Get your API key from https://serpapi.com/dashboard');
      throw new Error('SERPAPI_KEY environment variable is required and must be a valid API key');
    }
    
    console.log('SerpApi initialized with key:', this.apiKey.substring(0, 8) + '...');
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    // Build search parameters, only including defined values
    const searchParams = new URLSearchParams();
    
    // Required parameters
    searchParams.set('engine', 'google_flights');
    searchParams.set('api_key', this.apiKey);
    searchParams.set('departure_id', params.departure_id);
    searchParams.set('arrival_id', params.arrival_id);
    searchParams.set('outbound_date', params.outbound_date);
    
    // Optional parameters - only add if they have valid values
    if (params.return_date) {
      searchParams.set('return_date', params.return_date);
    }
    if (params.travel_class) {
      searchParams.set('travel_class', params.travel_class.toString());
    }
    if (params.adults && params.adults > 0) {
      searchParams.set('adults', params.adults.toString());
    }
    if (params.children && params.children > 0) {
      searchParams.set('children', params.children.toString());
    }
    if (params.infants_in_seat && params.infants_in_seat > 0) {
      searchParams.set('infants_in_seat', params.infants_in_seat.toString());
    }
    if (params.infants_on_lap && params.infants_on_lap > 0) {
      searchParams.set('infants_on_lap', params.infants_on_lap.toString());
    }
    if (params.type) {
      searchParams.set('type', params.type.toString());
    }

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    console.log('SerpApi Request URL:', url);
    console.log('SerpApi Parameters:', Object.fromEntries(searchParams.entries()));
    
    let response: Response;
    let rawData: any;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FlightBookingChatbot/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SerpApi Error Response:', response.status, response.statusText, errorText);
        throw new Error(`SerpApi request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      rawData = await response.json();
      console.log('SerpApi Raw Response Sample:', JSON.stringify({
        best_flights_count: rawData.best_flights?.length || 0,
        other_flights_count: rawData.other_flights?.length || 0,
        has_price_insights: !!rawData.price_insights,
        search_metadata: !!rawData.search_metadata,
      }));

      // Validate response with flexible Zod schema
      const validatedData = FlightSearchResultSchema.parse(rawData);
      
      // Log sample flight data for debugging
      if (validatedData.best_flights && validatedData.best_flights.length > 0) {
        console.log('Sample best flight:', JSON.stringify(validatedData.best_flights[0], null, 2));
      }
      if (validatedData.other_flights && validatedData.other_flights.length > 0) {
        console.log('Sample other flight:', JSON.stringify(validatedData.other_flights[0], null, 2));
      }
      
      // Filter flights based on actual SerpApi structure
      if (validatedData.best_flights) {
        const beforeCount = validatedData.best_flights.length;
        validatedData.best_flights = validatedData.best_flights.filter(flight => {
          if (!flight) return false;
          
          // Check if flight has the new nested structure (flights array)
          if (flight.flights && Array.isArray(flight.flights) && flight.flights.length > 0) {
            const firstSegment = flight.flights[0];
            return firstSegment && (firstSegment.departure_airport || firstSegment.arrival_airport || firstSegment.airline);
          }
          
          // Fallback to legacy structure
          return flight.departure_airport || flight.arrival_airport || flight.airline;
        });
        console.log(`Best flights: ${beforeCount} -> ${validatedData.best_flights.length} after filtering`);
      }
      
      if (validatedData.other_flights) {
        const beforeCount = validatedData.other_flights.length;
        validatedData.other_flights = validatedData.other_flights.filter(flight => {
          if (!flight) return false;
          
          // Check if flight has the new nested structure (flights array)
          if (flight.flights && Array.isArray(flight.flights) && flight.flights.length > 0) {
            const firstSegment = flight.flights[0];
            return firstSegment && (firstSegment.departure_airport || firstSegment.arrival_airport || firstSegment.airline);
          }
          
          // Fallback to legacy structure
          return flight.departure_airport || flight.arrival_airport || flight.airline;
        });
        console.log(`Other flights: ${beforeCount} -> ${validatedData.other_flights.length} after filtering`);
      }

      return validatedData;
    } catch (error) {
      console.error('SerpApi flight search error:', error);
      
      // If it's a Zod validation error and we have raw data, try graceful degradation
      if (error instanceof z.ZodError && rawData) {
        console.log('Zod validation failed, attempting graceful degradation...');
        console.log('Validation errors:', error.errors.slice(0, 5)); // Show first 5 errors
        try {
          // Filter and clean the flight data manually
          const cleanFlights = (flights: any[]) => {
            if (!Array.isArray(flights)) return [];
            return flights
              .filter(flight => flight && typeof flight === 'object')
              .slice(0, 5) // Limit results
              .map(flight => {
                // Handle nested structure where flight info is in flights[0]
                let flightInfo = flight;
                if (flight.flights && Array.isArray(flight.flights) && flight.flights.length > 0) {
                  flightInfo = flight.flights[0];
                }
                
                return {
                  // Use nested structure if available, otherwise fallback
                  departure_airport: flightInfo.departure_airport || flight.departure_airport || { name: 'Unknown', id: '', time: '' },
                  arrival_airport: flightInfo.arrival_airport || flight.arrival_airport || { name: 'Unknown', id: '', time: '' },
                  duration: flightInfo.duration || flight.total_duration || flight.duration || 0,
                  airline: flightInfo.airline || flight.airline || 'Unknown Airline',
                  flight_number: flightInfo.flight_number || flight.flight_number || 'N/A',
                  travel_class: flightInfo.travel_class || flight.travel_class || 'economy',
                  price: flight.price || undefined,
                  // Keep other fields that might exist
                  ...flight,
                  // Also include the nested flights array
                  flights: flight.flights || undefined,
                };
              });
          };

          // Return minimal safe structure even if validation fails
          return {
            best_flights: cleanFlights(rawData.best_flights || []),
            other_flights: cleanFlights(rawData.other_flights || []),
            price_insights: rawData.price_insights || undefined,
            search_metadata: {
              google_flights_url: rawData.search_metadata?.google_flights_url || 'https://www.google.com/travel/flights'
            },
            search_parameters: rawData.search_parameters || {}
          } as FlightSearchResult;
        } catch (parseError) {
          console.error('Failed to create fallback structure:', parseError);
        }
      }
      
      throw new Error(`Flight search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const serpApiService = new SerpApiService(); 