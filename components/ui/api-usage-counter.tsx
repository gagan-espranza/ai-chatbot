'use client';

import React, { useState, useEffect } from 'react';

// Global function to increment usage
export const incrementApiUsage = () => {
  if (typeof window !== 'undefined') {
    const currentUsage = parseInt(localStorage.getItem('serpapi_usage') || '0', 10);
    const newUsage = currentUsage + 1;
    localStorage.setItem('serpapi_usage', newUsage.toString());
    
    // Trigger a custom event to update the counter
    window.dispatchEvent(new CustomEvent('serpapi-usage-updated', { detail: newUsage }));
  }
};

export function ApiUsageCounter() {
  const [usage, setUsage] = useState(0);
  const maxUsage = 100; // Free tier limit

  useEffect(() => {
    // Get current usage from localStorage (simple counter for MVP)
    if (typeof window !== 'undefined') {
      const currentUsage = localStorage.getItem('serpapi_usage') || '0';
      setUsage(parseInt(currentUsage, 10));

      // Listen for usage updates
      const handleUsageUpdate = (event: CustomEvent) => {
        setUsage(event.detail);
      };

      window.addEventListener('serpapi-usage-updated', handleUsageUpdate as EventListener);
      
      return () => {
        window.removeEventListener('serpapi-usage-updated', handleUsageUpdate as EventListener);
      };
    }
  }, []);

  const getUsageColor = () => {
    const percentage = (usage / maxUsage) * 100;
    if (percentage >= 90) return 'bg-red-500 text-white';
    if (percentage >= 70) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getUsageColor()} shadow-lg z-50`}>
      API: {usage}/{maxUsage}
    </div>
  );
} 