import React from 'react';
import { Briefcase, ChevronDown, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Badge from './badge';
import type { Flight } from '@/lib/services/serpapi';

interface FlightCardProps {
  flight: Flight;
  showPrice?: boolean;
  isBestValue?: boolean;
}

export function FlightCard({ flight, showPrice = true, isBestValue = false }: FlightCardProps) {
  // Handle nested SerpApi structure - get first and last segments for multi-leg flights
  const firstLeg = flight.flights && flight.flights.length > 0 ? flight.flights[0] : flight;
  const lastLeg = flight.flights && flight.flights.length > 1 ? flight.flights[flight.flights.length - 1] : firstLeg;
  const isMultiLeg = flight.flights && flight.flights.length > 1;
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle both "2025-12-14 08:05" and "08:05" formats
      if (timeString.includes(' ')) {
        return new Date(timeString).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        });
      } else {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        });
      }
    } catch {
      return timeString;
    }
  };

  const formatDate = (timeString: string) => {
    try {
      // Handle both "2025-12-14 08:05" and "08:05" formats
      if (timeString.includes(' ')) {
        return new Date(timeString).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        return ''; // No date available
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-6 h-auto flex flex-col gap-6 bg-white hover:ring-1 hover:ring-gray-900 hover:border-gray-900 transition-all duration-500 cursor-pointer group relative">
      {/* Badge */}
      {isBestValue && (
        <div className="absolute -top-2.5 left-6">
          <Badge>
            <Sparkles size={12} /> Best Value
          </Badge>
        </div>
      )}
      
      {/* Top - row 1 */}
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-2">
          <div>
            {(flight.airline_logo || firstLeg.airline_logo) ? (
              <Image 
                src={flight.airline_logo || firstLeg.airline_logo || ''} 
                alt="airline" 
                width={32} 
                height={32}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                {(firstLeg.airline || flight.airline || 'UK').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            {firstLeg.airline || flight.airline || 'Unknown Airline'} / {isMultiLeg ? `${flight.flights?.length} stops` : firstLeg.flight_number || flight.flight_number || 'N/A'}
          </div>
        </div>
        
        {/* Right */}
        <div className="flex flex-row gap-6 items-center">
          <div className="text-sm text-neutral-400 flex flex-row gap-3 items-center">
            <div>Non-refundable</div>
            <div className="size-1 bg-neutral-500 rounded-full" />
            <div className="flex flex-row gap-1.5 items-center">
              <Briefcase size={16} />
              <div>7kg, 23kg</div>
            </div>
          </div>
          {showPrice && flight.price && (
            <div className="text-xl font-semibold">${flight.price}</div>
          )}
        </div>
      </div>
      
      {/* Dates - row 2 */}
      <div className="flex flex-row gap-6 items-center">
        {/* Departure */}
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold">
            {firstLeg.departure_airport?.time ? formatTime(firstLeg.departure_airport.time) : '--:--'} - {firstLeg.departure_airport?.time ? formatDate(firstLeg.departure_airport.time) : 'N/A'}
          </div>
          <div className="text-sm text-neutral-400">
            {firstLeg.departure_airport?.name || 'Unknown'} ({firstLeg.departure_airport?.id || 'N/A'})
          </div>
        </div>
        
        {/* Duration */}
        <div className="flex-1 flex flex-col gap-1 items-center px-40">
          <div className="text-base font-semibold">
            {formatDuration(flight.total_duration || 0)}
          </div>
          <div className="w-full flex flex-row gap-1 items-center">
            <div className="h-px w-full bg-gradient-to-r from-white to-neutral-300 rounded-full" />
            <div className="size-1 bg-neutral-800 rounded-full shrink-0" />
            <div className="h-px w-full bg-gradient-to-r from-neutral-300 to-white rounded-full" />
          </div>
          <div className="text-sm text-neutral-400">
            {isMultiLeg && flight.flights ? `${flight.flights.length - 1} stop${flight.flights.length === 2 ? '' : 's'}` : 'Direct'}
          </div>
        </div>
        
        {/* Arrival */}
        <div className="flex flex-col gap-1 items-end">
          <div className="text-base font-semibold">
            {lastLeg.arrival_airport?.time ? formatTime(lastLeg.arrival_airport.time) : '--:--'} - {lastLeg.arrival_airport?.time ? formatDate(lastLeg.arrival_airport.time) : 'N/A'}
          </div>
          <div className="text-sm text-neutral-400">
            {lastLeg.arrival_airport?.name || 'Unknown'} ({lastLeg.arrival_airport?.id || 'N/A'})
          </div>
        </div>
      </div>
      
      {/* Bottom - row 3 */}
      <div className="flex flex-row gap-6 items-center justify-center rounded-lg p-0.5 w-fit text-neutral-300 border border-gray-200 opacity-0 -translate-x-1/2 group-hover:opacity-100 group-hover:text-neutral-900 group-hover:bg-white group-hover:shadow-lg transition-all duration-500 mx-auto absolute -bottom-0 left-1/2 group-hover:translate-y-1/2">
        <ChevronDown size={16} />
      </div>
    </div>
  );
} 