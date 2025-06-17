import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FlightCard } from './flight-card';
import type { Flight } from '@/lib/services/serpapi';

interface FlightResultsProps {
  searchParameters: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    travelClass: string;
    tripType: string;
  };
  priceInsights?: {
    lowest_price?: number;
    price_level?: string;
    typical_price_range?: number[];
  };
  bestFlights?: Flight[];
  otherFlights?: Flight[];
  totalResults: number;
  searchUrl: string;
}

export function FlightResults({
  searchParameters,
  priceInsights,
  bestFlights,
  otherFlights,
  totalResults,
  searchUrl
}: FlightResultsProps) {
  const getPriceLevelIcon = (level?: string) => {
    switch (level) {
      case 'low':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'high':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriceLevelColor = (level?: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Flight Search Results</h2>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
            View on Google Flights
          </a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Route</p>
            <p className="text-gray-600">{searchParameters.origin} → {searchParameters.destination}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Dates</p>
            <p className="text-gray-600">
              {searchParameters.departureDate}
              {searchParameters.returnDate && ` - ${searchParameters.returnDate}`}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Passengers</p>
            <p className="text-gray-600">{searchParameters.passengers} {searchParameters.travelClass}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Results</p>
            <p className="text-gray-600">{totalResults} flights found</p>
          </div>
        </div>
      </div>

      {/* Price Insights */}
      {priceInsights && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Price Insights</h3>
            {getPriceLevelIcon(priceInsights.price_level)}
          </div>
          
          <div className="flex items-center gap-6">
            {priceInsights.lowest_price && (
              <div>
                <p className="text-2xl font-bold text-gray-900">${priceInsights.lowest_price}</p>
                <p className="text-sm text-gray-600">Lowest price found</p>
              </div>
            )}
            {priceInsights.price_level && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border capitalize ${getPriceLevelColor(priceInsights.price_level)}`}>
                {priceInsights.price_level} price level
              </span>
            )}
            {priceInsights.typical_price_range && (
              <div>
                <p className="text-sm text-gray-600">
                  Typical range: ${priceInsights.typical_price_range[0]} - ${priceInsights.typical_price_range[1]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Best Flights */}
      {bestFlights && bestFlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Flights</h3>
          {bestFlights.map((flight, index) => (
            <FlightCard 
              key={`best-${index}`} 
              flight={flight} 
              isBestValue={index === 0}
            />
          ))}
        </div>
      )}

      {/* Other Flights */}
      {otherFlights && otherFlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Options</h3>
          {otherFlights.map((flight, index) => (
            <FlightCard key={`other-${index}`} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
} 