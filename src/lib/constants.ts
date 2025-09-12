// Time slot options for delivery scheduling
export const TIME_SLOTS = {
  MORNING: [
    { value: '6:00 AM - 7:00 AM', label: '6:00 AM - 7:00 AM' },
    { value: '7:00 AM - 8:00 AM', label: '7:00 AM - 8:00 AM' },
    { value: '8:00 AM - 9:00 AM', label: '8:00 AM - 9:00 AM' },
    { value: '9:00 AM - 10:00 AM', label: '9:00 AM - 10:00 AM' },
  ],
  EVENING: [
    { value: '6:00 PM - 7:00 PM', label: '6:00 PM - 7:00 PM' },
    { value: '7:00 PM - 8:00 PM', label: '7:00 PM - 8:00 PM' },
    { value: '8:00 PM - 9:00 PM', label: '8:00 PM - 9:00 PM' },
  ],
} as const;

// Flattened array for easy mapping
export const ALL_TIME_SLOTS = [
  ...TIME_SLOTS.MORNING,
  ...TIME_SLOTS.EVENING,
];

// Helper function to get time slot category
export const getTimeSlotCategory = (timeSlot: string): 'Morning' | 'Evening' | null => {
  if (TIME_SLOTS.MORNING.some(slot => slot.value === timeSlot)) {
    return 'Morning';
  }
  if (TIME_SLOTS.EVENING.some(slot => slot.value === timeSlot)) {
    return 'Evening';
  }
  return null;
};

// Time-based booking restrictions for trial orders
export const BOOKING_RESTRICTIONS = {
  EVENING_CUTOFF_HOUR: 15, // 3:00 PM (24-hour format)
  FUTURE_DATE_CUTOFF_HOUR: 0, // 12:00 AM (midnight)
} as const;

// Utility functions for time-based slot validation
export const getCurrentTime = () => {
  return new Date();
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to beginning of day
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate > today;
};

export const canBookEveningSlotToday = (): boolean => {
  const now = getCurrentTime();
  const currentHour = now.getHours();
  return currentHour < BOOKING_RESTRICTIONS.EVENING_CUTOFF_HOUR;
};

export const canBookFutureDate = (): boolean => {
  const now = getCurrentTime();
  const currentHour = now.getHours();
  // Can book future dates only before midnight (before 12:00 AM next day)
  // Since we're using 24-hour format, midnight is hour 0
  // So we can book if it's NOT the midnight hour (0)
  return currentHour !== BOOKING_RESTRICTIONS.FUTURE_DATE_CUTOFF_HOUR;
};

// Utility function to parse time slot and check if current time has passed it
export const parseTimeSlot = (timeSlot: string): { startHour: number; endHour: number } => {
  // Parse format like "6:00 AM - 7:00 AM" or "6:00 PM - 7:00 PM"
  const [startTime, endTime] = timeSlot.split(' - ');
  
  const parseTime = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hourStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return hour;
  };
  
  return {
    startHour: parseTime(startTime),
    endHour: parseTime(endTime)
  };
};

export const hasTimeSlotPassed = (timeSlot: string): boolean => {
  const now = getCurrentTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const { endHour } = parseTimeSlot(timeSlot);
  const slotEndMinutes = endHour * 60; // End of slot in minutes
  
  // If current time has passed the end of the slot, it's no longer available
  return currentTotalMinutes >= slotEndMinutes;
};

export const isSlotAvailable = (selectedDate: Date | undefined, timeSlot: string): boolean => {
  if (!selectedDate) return true; // If no date selected, all slots available
  
  const now = getCurrentTime();
  const slotCategory = getTimeSlotCategory(timeSlot);
  
  // If selected date is today
  if (isSameDay(selectedDate, now)) {
    // For same-day bookings, check if the time slot has already passed
    if (hasTimeSlotPassed(timeSlot)) {
      return false; // Time slot has already passed
    }
    
    // For evening slots on today, additional check if it's before 3:00 PM
    if (slotCategory === 'Evening') {
      return canBookEveningSlotToday();
    }
    
    // Morning slots are available only if they haven't passed yet
    return true;
  }
  
  // If selected date is in the future
  if (isFutureDate(selectedDate)) {
    // Check if current time allows booking future dates (before midnight cutoff)
    return canBookFutureDate();
  }
  
  // For past dates (shouldn't happen with proper date validation), disallow
  return false;
};

export const getSlotRestrictionMessage = (selectedDate: Date | undefined, timeSlot: string): string | null => {
  if (!selectedDate) return null;
  
  const now = getCurrentTime();
  const slotCategory = getTimeSlotCategory(timeSlot);
  
  // Check if this specific time slot has passed for same-day booking
  if (isSameDay(selectedDate, now) && hasTimeSlotPassed(timeSlot)) {
    return `Slots are filled, book in the next shift`;
  }
  
  if (isSameDay(selectedDate, now) && slotCategory === 'Evening' && !canBookEveningSlotToday()) {
    return `Slots are filled, book in the next shift`;
  }
  
  if (isFutureDate(selectedDate) && !canBookFutureDate()) {
    return `Booking window closed, please try again later`;
  }
  
  return null;
};

// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  DEFAULT_CENTER: {
    lat: 12.9716, // Bangalore coordinates as default
    lng: 77.5946
  },
  DEFAULT_ZOOM: 13
} as const;

// Debug helper for Google Maps API key validation
export const debugGoogleMapsConfig = () => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  console.log('🔍 Google Maps Debug Info:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyValid: apiKey?.startsWith('AIza'),
    apiKeyStart: apiKey?.substring(0, 15) + '...',
    envRaw: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 15) + '...',
    nodeEnv: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
  });
  return {
    isValid: !!(apiKey && apiKey.startsWith('AIza') && apiKey.length > 30),
    apiKey: apiKey
  };
};