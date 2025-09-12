"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GOOGLE_MAPS_CONFIG, debugGoogleMapsConfig } from '@/lib/constants';
import { MapPin, Search, Loader2 } from 'lucide-react';

// Debug helper for Google Maps container issues
const debugGoogleMapsSetup = () => {
  console.log('=== Google Maps Debug Info ===');
  console.log('Google available:', !!window.google);
  console.log('Maps available:', !!window.google?.maps);
  console.log('Places available:', !!window.google?.maps?.places);
  console.log('API Key present:', !!GOOGLE_MAPS_CONFIG.API_KEY);
  console.log('API Key valid format:', GOOGLE_MAPS_CONFIG.API_KEY?.startsWith('AIza'));
  
  // Check for containers
  const containers = document.querySelectorAll('[data-map-container]');
  console.log('Map containers found:', containers.length);
  
  containers.forEach((container, index) => {
    const rect = container.getBoundingClientRect();
    console.log(`Container ${index + 1}:`, {
      id: container.id,
      isConnected: container.isConnected,
      dimensions: rect,
      styles: window.getComputedStyle(container as Element)
    });
  });
  
  // Check dialog elements
  const dialogs = document.querySelectorAll('[role="dialog"]');
  const portals = document.querySelectorAll('[data-radix-portal]');
  console.log('Dialog elements:', dialogs.length);
  console.log('Portal elements:', portals.length);
  
  console.log('=== End Debug Info ===');
};

// Clean, simple Google Maps API loader
const loadGoogleMapsAPI = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already available
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log('⏳ Google Maps script already exists, waiting...');
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    console.log('📥 Loading Google Maps API script...');
    
    // Create a unique callback name
    const callbackName = 'initGoogleMaps' + Date.now();
    
    // Set up global callback
    (window as any)[callbackName] = () => {
      console.log('✅ Google Maps API loaded via callback');
      // Clean up global callback
      delete (window as any)[callbackName];
      resolve();
    };

    // Load the Google Maps JavaScript API with all required libraries
    const script = document.createElement('script');
    const apiKey = GOOGLE_MAPS_CONFIG.API_KEY?.trim();
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    console.log('📡 Loading script from:', script.src.replace(apiKey, 'API_KEY_HIDDEN'));
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script:', error);
      console.error('❌ Script details:', {
        src: script.src,
        integrity: script.integrity,
        crossOrigin: script.crossOrigin
      });
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps API script. Check your internet connection and API key.'));
    };

    document.head.appendChild(script);
  });
};

export interface Address {
  formatted_address: string;
  lat: number;
  lng: number;
  place_id?: string;
}

interface MapSelectorProps {
  onAddressSelect: (address: Address) => void;
  onClose: () => void;
}

export function MapSelector({ onAddressSelect, onClose }: MapSelectorProps) {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastLocationRequest, setLastLocationRequest] = useState<number>(0);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const geolocationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Unique container ID for direct DOM access
  const CONTAINER_ID = 'google-maps-container-' + Date.now();

  // Clean, simple Google Maps initialization with modal-aware timing
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const initializeMap = async () => {
      if (!isMounted) return;

      // Use debug helper for comprehensive validation
      const debugInfo = debugGoogleMapsConfig();
      
      if (!debugInfo.isValid) {
        console.error('❌ Google Maps API key validation failed - see debug info above');
        setMapError('Google Maps API key is invalid or not configured. Please verify your .env.local file contains a valid NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
        setIsLoading(false);
        return;
      }
      
      const apiKey = debugInfo.apiKey;

      // Wait for container to be ready with portal-aware retry mechanism
      let retryCount = 0;
      const maxRetries = 25; // Increased to 25 for portal timing
      const retryDelay = 200; // Base delay increased to 200ms for portal rendering
      
      const findOrCreateContainer = async (): Promise<HTMLElement | null> => {
        console.log('🔍 Google Maps container detection starting...');
        
        // Method 1: Direct DOM query by ID
        let container = document.getElementById(CONTAINER_ID) as HTMLElement | null;
        
        if (container) {
          console.log('✅ Container found by ID:', CONTAINER_ID);
          
          // Validate container dimensions
          const rect = container.getBoundingClientRect();
          const hasValidDimensions = rect.width > 0 && rect.height > 0;
          const isConnected = container.isConnected;
          const inDOM = document.contains(container);
          
          console.log('📐 Container validation:', {
            id: container.id,
            hasValidDimensions,
            isConnected,
            inDOM,
            width: rect.width,
            height: rect.height
          });
          
          if (hasValidDimensions && isConnected && inDOM) {
            return container;
          }
          
          console.log('⚠️ Container exists but invalid, will recreate...');
        }
        
        // Method 2: Find by data attribute as fallback
        container = document.querySelector('[data-map-container="google-maps"]') as HTMLElement | null;
        if (container && container.getBoundingClientRect().width > 0) {
          console.log('✅ Container found by data attribute');
          return container;
        }
        
        // Method 3: Programmatic container creation
        console.log('🔄 Creating fallback container...');
        
        // Find dialog content or fallback to body
        const dialogContent = document.querySelector('[role="dialog"] [data-map-container]')?.parentElement || 
                            document.querySelector('[role="dialog"]') || 
                            document.querySelector('[data-radix-portal]') ||
                            document.body;
        
        if (!dialogContent) {
          console.error('❌ No suitable parent found for container');
          return null;
        }
        
        // Remove any existing fallback containers
        const existingFallback = dialogContent.querySelector('#google-maps-fallback-container');
        if (existingFallback) {
          existingFallback.remove();
        }
        
        // Create new container
        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'google-maps-fallback-container';
        fallbackContainer.setAttribute('data-map-container', 'google-maps-fallback');
        fallbackContainer.style.cssText = `
          height: 400px;
          width: 100%;
          min-height: 300px;
          min-width: 300px;
          position: relative;
          display: block;
          background-color: #f5f5f5;
          border-radius: 8px;
        `;
        
        dialogContent.appendChild(fallbackContainer);
        
        console.log('✅ Fallback container created and appended');
        return fallbackContainer;
      };

      // Find or create the Google Maps container
      const containerElement = await findOrCreateContainer();
      
      if (!containerElement) {
        console.error('❌ Failed to find or create Google Maps container');
        setMapError('Could not initialize map container. Please try refreshing the page.');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Google Maps container ready:', {
        id: containerElement.id,
        dimensions: containerElement.getBoundingClientRect(),
        isConnected: containerElement.isConnected
      });

      try {
        console.log('🗺️ Starting Google Maps initialization...');
        console.log('🔑 Using API Key:', apiKey.substring(0, 15) + '...');
        console.log('🌐 Environment details:', {
          userAgent: navigator.userAgent,
          origin: window.location.origin,
          hostname: window.location.hostname,
          port: window.location.port
        });
        
        // Load Google Maps API
        await loadGoogleMapsAPI();
        
        if (!isMounted) return;

        // Enhanced container validation using resolved container
        const containerStyle = window.getComputedStyle(containerElement);
        console.log('📐 Container check:', {
          offsetWidth: containerElement.offsetWidth,
          offsetHeight: containerElement.offsetHeight,
          clientWidth: containerElement.clientWidth,
          clientHeight: containerElement.clientHeight,
          boundingRect: containerElement.getBoundingClientRect(),
          display: containerStyle.display,
          visibility: containerStyle.visibility,
          position: containerStyle.position,
          zIndex: containerStyle.zIndex,
          overflow: containerStyle.overflow,
          isConnected: containerElement.isConnected,
          inDOM: document.contains(containerElement)
        });

        // Ensure container has proper dimensions and is visible
        const hasValidDimensions = containerElement.offsetWidth > 0 && containerElement.offsetHeight > 0;
        const isVisible = containerStyle.display !== 'none' && containerStyle.visibility !== 'hidden';
        const isProperlyMounted = containerElement.isConnected && document.contains(containerElement);
        
        if (!hasValidDimensions || !isVisible || !isProperlyMounted) {
          console.warn('⚠️ Container validation failed:', { hasValidDimensions, isVisible, isProperlyMounted });
          console.warn('⚠️ Forcing container layout and visibility...');
          
          // Force container to be properly sized and visible
          containerElement.style.width = '100%';
          containerElement.style.height = '400px';
          containerElement.style.minWidth = '300px';
          containerElement.style.minHeight = '400px';
          containerElement.style.display = 'block';
          containerElement.style.visibility = 'visible';
          containerElement.style.position = 'relative';
          containerElement.style.backgroundColor = '#f5f5f5';
          
          // Force layout recalculation
          containerElement.offsetHeight; // Trigger reflow
          
          // Allow layout to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const newRect = containerElement.getBoundingClientRect();
          console.log('📐 After forced layout:', {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight,
            boundingRect: newRect,
            isNowVisible: newRect.width > 0 && newRect.height > 0
          });
          
          // Final validation
          if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
            throw new Error('Container still has zero dimensions after forced layout. Portal may not be fully rendered.');
          }
        }

        // Clear any existing content from resolved container
        containerElement.innerHTML = '';

        console.log('🏗️ Creating Google Maps instance...');
        
        // Add IntersectionObserver to ensure container is visible
        const isIntersecting = await new Promise<boolean>((resolve) => {
          const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            observer.disconnect();
            resolve(entry.isIntersecting && entry.intersectionRatio > 0);
          }, { threshold: 0.1 });
          
          observer.observe(containerElement);
          
          // Fallback timeout in case observer doesn't fire
          setTimeout(() => {
            observer.disconnect();
            resolve(true); // Assume visible if observer doesn't respond
          }, 500);
        });
        
        if (!isIntersecting && isMounted) {
          console.warn('⚠️ Container may not be visible in viewport, but proceeding...');
        }
        
        // Cleanup existing instances (React Strict Mode handling)
        if (mapInstanceRef.current) {
          console.log('🧩 Cleaning up existing map instance');
          
          // Clear existing markers
          markersRef.current.forEach(marker => {
            marker.setMap(null);
            google.maps.event.clearInstanceListeners(marker);
          });
          markersRef.current = [];
          
          // Clear map event listeners
          google.maps.event.clearInstanceListeners(mapInstanceRef.current);
          mapInstanceRef.current = null;
        }
        
        if (!isMounted) return;

        // Create map with Google Maps-specific configuration
        const mapInstance = new google.maps.Map(containerElement, {
          center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
          zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          backgroundColor: '#f5f5f5',
          mapTypeControl: true
        });

        mapInstanceRef.current = mapInstance;
        console.log('✅ Google Maps instance created');

        // Initialize Google Maps services
        placesServiceRef.current = new google.maps.places.PlacesService(mapInstance);
        geocoderRef.current = new google.maps.Geocoder();
        
        // Initialize AutocompleteService with error handling
        try {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
          console.log('✅ Google Maps services initialized, including AutocompleteService');
        } catch (error) {
          console.error('❌ Failed to initialize AutocompleteService:', error);
        }

        // Create initial marker
        const markerInstance = new google.maps.Marker({
          position: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
          map: mapInstance,
          title: 'Select your delivery location',
          draggable: true,
          animation: google.maps.Animation.DROP
        });

        markersRef.current = [markerInstance];
        console.log('✅ Marker created successfully');

        // Set up event listeners
        markerInstance.addListener('dragend', () => {
          if (!isMounted) return;
          const position = markerInstance.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            console.log('🎯 Marker moved to:', lat, lng);
            geocodeLocation(lat, lng);
          }
        });

        mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!isMounted || !event.latLng) return;
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          console.log('🗺️ Map clicked at:', lat, lng);
          
          // Clear existing markers and create new one
          markersRef.current.forEach(marker => marker.setMap(null));
          const newMarker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            title: 'Selected location',
            draggable: true,
            animation: google.maps.Animation.DROP
          });
          
          // Add drag listener to new marker
          newMarker.addListener('dragend', () => {
            if (!isMounted) return;
            const pos = newMarker.getPosition();
            if (pos) {
              geocodeLocation(pos.lat(), pos.lng());
            }
          });
          
          markersRef.current = [newMarker];
          geocodeLocation(lat, lng);
        });

        // Wait for Google Maps to fully load with tilesloaded event
        google.maps.event.addListenerOnce(mapInstance, 'tilesloaded', () => {
          if (!isMounted) return;
          
          console.log('✅ Google Maps tiles loaded - fully initialized');
          
          // Force a resize to ensure proper rendering
          setTimeout(() => {
            if (isMounted && mapInstanceRef.current) {
              google.maps.event.trigger(mapInstanceRef.current, 'resize');
              mapInstanceRef.current.setCenter(GOOGLE_MAPS_CONFIG.DEFAULT_CENTER);
              console.log('🔄 Map resized and centered after tiles loaded');
            }
          }, 100);
          
          setIsLoading(false);
          setMapError(null);
        });

        console.log('🎉 Google Maps setup completed successfully!');

        // Get initial address after a short delay to ensure map is ready
        setTimeout(() => {
          if (isMounted) {
            geocodeLocation(
              GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat,
              GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng
            );
          }
        }, 500);

      } catch (error) {
        console.error('❌ Google Maps initialization failed:', error);
        
        // Run comprehensive debug info
        debugGoogleMapsSetup();
        
        // Enhanced error diagnostics
        const errorDetails = {
          error: error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          environment: {
            apiKey: GOOGLE_MAPS_CONFIG.API_KEY ? `${GOOGLE_MAPS_CONFIG.API_KEY.substring(0, 10)}...` : 'NOT SET',
            origin: window.location.origin,
            href: window.location.href,
            nodeEnv: process.env.NODE_ENV,
            containerExists: !!containerElement,
            containerDimensions: containerElement ? {
              width: containerElement.offsetWidth,
              height: containerElement.offsetHeight,
              rect: containerElement.getBoundingClientRect()
            } : null,
            googleMapsLoaded: !!(window.google && window.google.maps),
            googleMapsPlacesLoaded: !!(window.google?.maps?.places)
          }
        };
        
        console.error('❌ Comprehensive Google Maps error details:', errorDetails);
        
        // Network connectivity check
        const isOnline = navigator.onLine;
        console.log('🌐 Network status:', { isOnline });
        
        // Provide specific error messages with enhanced diagnostics
        let errorMessage = 'Failed to load Google Maps. ';
        let troubleshooting: string[] = [];
        
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          
          if (msg.includes('container still has zero dimensions')) {
            errorMessage += 'Container layout issue detected.';
            troubleshooting = [
              'Close and reopen the address modal',
              'Ensure the modal is fully loaded before interaction',
              'Try resizing the browser window',
              'Check browser console for layout errors'
            ];
          } else if (msg.includes('api key') || msg.includes('apinotactivatedmaperror')) {
            errorMessage += 'API key configuration issue.';
            troubleshooting = [
              'Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local',
              'Enable Maps JavaScript API, Places API, and Geocoding API in Google Cloud Console',
              'Check API key permissions and quotas',
              'Ensure billing is enabled for your Google Cloud project'
            ];
          } else if (msg.includes('quota') || msg.includes('overquotamaperror')) {
            errorMessage += 'API quota exceeded.';
            troubleshooting = [
              'Check your Google Cloud Console billing and quotas',
              'Monitor API usage in Google Cloud Console',
              'Consider upgrading your quota limits',
              'Wait for quota reset (usually daily)'
            ];
          } else if (msg.includes('referernotallowedmaperror')) {
            errorMessage += 'Domain not authorized for API key.';
            troubleshooting = [
              'Add "localhost:3000/*" to HTTP referrer restrictions in Google Cloud Console',
              'Add your production domain to referrer restrictions',
              'Verify API key restrictions configuration',
              'Consider temporarily removing restrictions for testing'
            ];
          } else if (msg.includes('invalidkeymaperror')) {
            errorMessage += 'Invalid API key format.';
            troubleshooting = [
              'Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local',
              'Ensure API key starts with "AIza"',
              'Create a new API key if current one is corrupted',
              'Check for extra spaces or characters in the key'
            ];
          } else if (!isOnline) {
            errorMessage += 'Network connectivity issue detected.';
            troubleshooting = [
              'Check your internet connection',
              'Try refreshing the page',
              'Disable VPN or proxy if active',
              'Check firewall settings'
            ];
          } else {
            errorMessage += `Technical error: ${error.message}`;
            troubleshooting = [
              'Close and reopen the address modal',
              'Refresh the page and try again',
              'Check browser console for additional errors',
              'Try a different browser or incognito mode'
            ];
          }
        } else {
          errorMessage += 'Unknown error occurred.';
          troubleshooting = [
            'Check browser console for detailed error information',
            'Refresh the page and try again',
            'Try a different browser',
            'Contact support if the issue persists'
          ];
        }
        
        // Enhanced error message with debug info
        const finalErrorMessage = `${errorMessage}\n\nDebug Info:\n- Container: ${containerElement ? 'Found' : 'Not Found'}\n- Google Maps API: ${!!(window.google && window.google.maps) ? 'Loaded' : 'Not Loaded'}\n- Network: ${isOnline ? 'Online' : 'Offline'}\n\nTroubleshooting: ${troubleshooting.join('; ')}`;
        
        setMapError(finalErrorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Add significant delay to ensure dialog portal and animations are complete
    timeoutId = setTimeout(() => {
      if (isMounted) {
        initializeMap();
      }
    }, 400); // Increased from 200ms to 400ms for portal/animation timing
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Clear debounce timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Clear geolocation timeout
      if (geolocationTimeoutRef.current) {
        clearTimeout(geolocationTimeoutRef.current);
      }
      
      // Cleanup Google Maps instances to prevent memory leaks
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          marker.setMap(null);
          google.maps.event?.clearInstanceListeners(marker);
        });
        markersRef.current = [];
      }
      
      if (mapInstanceRef.current) {
        google.maps.event?.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
      
      // Reset service refs
      placesServiceRef.current = null;
      geocoderRef.current = null;
      autocompleteServiceRef.current = null;
      autocompleteRef.current = null;
      
      // Reset state
      setSelectedAddress(null);
      setMapError(null);
      setIsLoading(true);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      setIsLoadingCurrentLocation(false);
      setLocationError(null);
      setLastLocationRequest(0);
    };
  }, []);

  const geocodeLocation = async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      console.warn('Geocoder not available, creating new instance');
      geocoderRef.current = new google.maps.Geocoder();
    }
    
    try {
      const response = await geocoderRef.current.geocode({ 
        location: { lat, lng } 
      });
      
      if (response.results[0]) {
        const result = response.results[0];
        const address: Address = {
          formatted_address: result.formatted_address,
          lat,
          lng,
          place_id: result.place_id
        };
        setSelectedAddress(address);
        console.log('📍 Geocoded address:', address.formatted_address);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      // Fallback: Use coordinates as address
      const address: Address = {
        formatted_address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng
      };
      setSelectedAddress(address);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current || !placesServiceRef.current) return;
    
    setIsSearching(true);
    
    try {
      const request = {
        query: searchQuery,
        fields: ['place_id', 'formatted_address', 'geometry']
      };

      placesServiceRef.current.findPlaceFromQuery(request, async (results, status) => {
        setIsSearching(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          const location = place.geometry?.location;
          
          if (location && mapInstanceRef.current) {
            const lat = location.lat();
            const lng = location.lng();
            
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(16);
            
            // Clear existing markers and create new one at search result
            markersRef.current.forEach(marker => marker.setMap(null));
            const newMarker = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: place.formatted_address || searchQuery,
              draggable: true,
              animation: google.maps.Animation.DROP
            });
            
            // Add drag listener to new marker
            newMarker.addListener('dragend', () => {
              const pos = newMarker.getPosition();
              if (pos) {
                geocodeLocation(pos.lat(), pos.lng());
              }
            });
            
            markersRef.current = [newMarker];
            
            // Use the search query if it contains more specific info than formatted_address
            const address: Address = {
              formatted_address: searchQuery.length > (place.formatted_address?.length || 0) ? 
                searchQuery : place.formatted_address || searchQuery,
              lat,
              lng,
              place_id: place.place_id
            };
            
            setSelectedAddress(address);
            console.log('🔍 Search result:', address.formatted_address);
          }
        } else {
          console.log('❌ No search results found');
        }
      });
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
    }
  };

  // Debounced search for autocomplete suggestions
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const searchSuggestions = async (query: string) => {
    console.log('🔍 Search suggestions called with:', query);
    
    if (!query.trim() || query.length < 2) {
      console.log('❌ Query too short or empty');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (!autocompleteServiceRef.current) {
      console.log('❌ Autocomplete service not ready, attempting to initialize...');
      // Try to initialize if Google Maps is available
      if (window.google?.maps?.places?.AutocompleteService) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        console.log('✅ Autocomplete service initialized');
      } else {
        console.log('❌ Google Maps Places API not available');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    }
    
    setIsLoadingSuggestions(true);
    console.log('⏳ Fetching suggestions...');
    
    try {
      const request = {
        input: query,
        location: new google.maps.LatLng(GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat, GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng),
        radius: 50000, // 50km radius
        types: ['establishment', 'geocode']
      };
      
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoadingSuggestions(false);
        console.log('📍 Autocomplete response:', { status, predictionsCount: predictions?.length || 0 });
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 6)); // Increased to 6 suggestions
          setShowSuggestions(true);
          console.log('✅ Suggestions updated:', predictions.slice(0, 6).map(p => p.description));
        } else {
          console.log('❌ No predictions or error status:', status);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('❌ Suggestions search failed:', error);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the search with ultra-fast response
    debounceRef.current = setTimeout(() => {
      searchSuggestions(query);
    }, 50);
  };
  
  const selectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (!placesServiceRef.current) return;
    
    // Get place details with enhanced fields to preserve business names
    const request = {
      placeId: suggestion.place_id,
      fields: ['geometry', 'formatted_address', 'place_id', 'name', 'types', 'address_components']
    };
    
    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
        const location = place.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
          
          // Clear existing markers and create new one
          markersRef.current.forEach(marker => marker.setMap(null));
          const newMarker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: place.formatted_address || suggestion.description,
            draggable: true,
            animation: google.maps.Animation.DROP
          });
          
          // Add drag listener to new marker
          newMarker.addListener('dragend', () => {
            const pos = newMarker.getPosition();
            if (pos) {
              geocodeLocation(pos.lat(), pos.lng());
            }
          });
          
          markersRef.current = [newMarker];
          
          // Preserve the original suggestion description which includes business names
          // Use the full suggestion description instead of Google's generic formatted_address
          const address: Address = {
            formatted_address: suggestion.description, // This preserves business names like "amaravathi gents pg"
            lat,
            lng,
            place_id: place.place_id
          };
          
          setSelectedAddress(address);
        }
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        selectSuggestion(suggestions[0]);
      } else {
        searchLocation();
      }
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      // Focus on first suggestion (could be enhanced for full keyboard navigation)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getCurrentLocation = async (retryCount = 0) => {
    // Debounce: Prevent rapid successive requests (minimum 2 seconds between requests)
    const now = Date.now();
    const timeSinceLastRequest = now - lastLocationRequest;
    const debounceDelay = 2000; // 2 seconds
    
    if (timeSinceLastRequest < debounceDelay) {
      console.log('🔄 Geolocation request debounced - too soon since last request');
      setLocationError('Please wait a moment before requesting location again.');
      setTimeout(() => setLocationError(null), 3000);
      return;
    }
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by this browser');
      setLocationError('Geolocation is not supported by your browser. Please enter your address manually.');
      setTimeout(() => setLocationError(null), 5000);
      return;
    }

    // Check permissions first
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setLocationError('Location permission denied. Please enable location access in your browser settings.');
          setTimeout(() => setLocationError(null), 8000);
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check geolocation permission status');
    }

    // Update state
    setIsLoadingCurrentLocation(true);
    setLocationError(null);
    setLastLocationRequest(now);

    console.log(`📍 Requesting current location (attempt ${retryCount + 1})`);

    // Clear any existing timeout
    if (geolocationTimeoutRef.current) {
      clearTimeout(geolocationTimeoutRef.current);
    }

    // Create a promise-based wrapper with enhanced options
    const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds timeout
          maximumAge: 60000 // Accept cached position up to 1 minute old
        };

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      const position = await getCurrentPositionPromise();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log(`✅ Current location found: ${lat}, ${lng} (accuracy: ${accuracy}m)`);

      if (mapInstanceRef.current) {
        // Animate to current location
        mapInstanceRef.current.panTo({ lat, lng });
        mapInstanceRef.current.setZoom(16);
        
        // Clear existing markers and create new one at current location
        markersRef.current.forEach(marker => marker.setMap(null));
        const newMarker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: 'Your current location',
          draggable: true,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          }
        });
        
        // Add drag listener to new marker
        newMarker.addListener('dragend', () => {
          const pos = newMarker.getPosition();
          if (pos) {
            geocodeLocation(pos.lat(), pos.lng());
          }
        });
        
        markersRef.current = [newMarker];
        await geocodeLocation(lat, lng);
        
        // Show success feedback
        console.log('🎯 Successfully set current location on map');
      }
    } catch (error: any) {
      console.error('❌ Geolocation error:', error);
      
      let errorMessage = 'Unable to get your current location. ';
      let shouldRetry = false;
      
      if (error.code) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again or enter your address manually.';
            shouldRetry = retryCount < 2; // Allow up to 3 attempts
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            shouldRetry = retryCount < 1; // Allow one retry for timeout
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try again or enter your address manually.';
            shouldRetry = retryCount < 1;
            break;
        }
      } else {
        errorMessage += 'Please try again or enter your address manually.';
        shouldRetry = retryCount < 1;
      }

      // Retry logic with exponential backoff
      if (shouldRetry) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        console.log(`🔄 Retrying geolocation in ${retryDelay}ms...`);
        
        geolocationTimeoutRef.current = setTimeout(() => {
          getCurrentLocation(retryCount + 1);
        }, retryDelay);
        
        setLocationError(`${errorMessage} Retrying in ${retryDelay / 1000} seconds...`);
      } else {
        setLocationError(errorMessage);
        setTimeout(() => setLocationError(null), 8000); // Clear error after 8 seconds
      }
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  };

  const confirmAddress = () => {
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  };

  // Remove the early return for loading state - always show the UI with loading overlay instead

  if (mapError) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">Google Maps Configuration Required</h4>
          <p className="text-sm text-red-700 mb-4">
            To use the address selection feature, please:
          </p>
          <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
            <li>Enable Maps JavaScript API, Places API, and Geocoding API</li>
            <li>Configure API key restrictions for localhost:3000</li>
          </ol>
        </div>
        
        {/* Manual Address Input Fallback */}
        <div className="space-y-2">
          <Label htmlFor="manual-address">Enter Address Manually</Label>
          <textarea 
            id="manual-address"
            name="manual-address"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            rows={3}
            placeholder="Enter your complete delivery address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="street-address"
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (searchQuery.trim()) {
                onAddressSelect({
                  formatted_address: searchQuery.trim(),
                  lat: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat,
                  lng: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng
                });
              }
            }}
            disabled={!searchQuery.trim()}
          >
            Use This Address
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="location-search">Search Location</Label>
        <div className="flex gap-2">
          <Input
            id="location-search"
            name="location-search"
            ref={searchInputRef}
            placeholder="Enter address or landmark..."
            value={searchQuery}
            onChange={handleSearchQueryChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              } else if (searchQuery.trim().length >= 2) {
                // Trigger suggestions immediately if there's already text
                searchSuggestions(searchQuery);
              }
            }}
            onBlur={(e) => {
              // Delay hiding suggestions to allow clicking on them
              setTimeout(() => {
                const activeElement = document.activeElement;
                const currentTarget = e.currentTarget;
                if (!activeElement || !currentTarget || !currentTarget.contains(activeElement)) {
                  setShowSuggestions(false);
                }
              }, 200);
            }}
            autoComplete="street-address"
          />
          <Button onClick={searchLocation} disabled={isSearching} aria-label="Search location">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            onClick={getCurrentLocation} 
            disabled={isLoadingCurrentLocation || isLoading}
            aria-label="Use current location"
            className="flex items-center gap-2"
          >
            {isLoadingCurrentLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Getting Location...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Current Location</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Search Suggestions Dropdown */}
        {showSuggestions && (
          <div className="relative">
            <div className="absolute top-1 left-0 right-0 bg-white border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto border-gray-200">
              {isLoadingSuggestions ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Finding nearby locations...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.place_id}
                      className="w-full text-left p-4 hover:bg-green-50 hover:border-l-2 hover:border-l-green-500 transition-all duration-200 group"
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-1 rounded-full bg-gray-100 group-hover:bg-green-100 transition-colors">
                          <MapPin className="h-3 w-3 text-gray-500 group-hover:text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate group-hover:text-green-900">
                            {suggestion.structured_formatting?.main_text || suggestion.description}
                          </div>
                          {suggestion.structured_formatting?.secondary_text && (
                            <div className="text-xs text-gray-500 truncate mt-1 group-hover:text-green-700">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() && (
                <div className="p-4 text-center text-sm text-gray-500">
                  <MapPin className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                  No locations found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Location Error Display */}
        {locationError && (
          <div className="mt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">{locationError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container - Optimized for Google Maps */}
      <div className="relative w-full rounded-lg border overflow-hidden bg-gray-100" style={{ height: '400px' }}>
        {/* Loading Overlay - Less intrusive, shows over map container */}
        {isLoading && (
          <div className="absolute top-4 left-4 z-40 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Loading map...</span>
            </div>
          </div>
        )}
        
        {/* Current Location Loading Overlay */}
        {isLoadingCurrentLocation && !isLoading && (
          <div className="absolute top-4 right-4 z-40 bg-blue-50/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Getting your location...</span>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {mapError && !isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50 rounded-lg">
            <div className="text-center p-6">
              <div className="text-red-600 mb-4">
                <MapPin className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="font-semibold text-red-800 mb-2">Google Maps Configuration Required</h3>
              <p className="text-red-700 text-sm mb-4">{mapError}</p>
              <div className="text-left bg-red-100 p-3 rounded text-xs text-red-800">
                <p className="font-medium mb-2">Quick Fix:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                  <li>Navigate to Credentials</li>
                  <li>Edit your API key</li>
                  <li>Add <code className="bg-red-200 px-1 rounded">localhost:3000</code> to HTTP referrers</li>
                  <li>Enable Maps JavaScript API and Places API</li>
                </ol>
              </div>
              <div className="mt-4">
                <Label htmlFor="manual-address-fallback">Enter Address Manually:</Label>
                <textarea 
                  id="manual-address-fallback"
                  name="manual-address-fallback"
                  className="w-full mt-2 p-2 border rounded text-sm resize-none"
                  rows={2}
                  placeholder="Enter your complete delivery address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  className="w-full mt-2"
                  onClick={() => {
                    if (searchQuery.trim()) {
                      onAddressSelect({
                        formatted_address: searchQuery.trim(),
                        lat: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat,
                        lng: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng
                      });
                    }
                  }}
                  disabled={!searchQuery.trim()}
                >
                  Use This Address
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Maps Container - Direct DOM Access */}
        <div 
          id={CONTAINER_ID}
          data-map-container="google-maps"
          className="w-full h-full rounded-lg"
          style={{ 
            width: '100%', 
            height: '400px',
            minHeight: '400px',
            minWidth: '300px',
            position: 'relative',
            display: 'block',
            backgroundColor: '#f5f5f5'
          }}
        />
        
        {/* Map Instructions Overlay */}
        {mapInstanceRef.current && !isLoading && !mapError && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg text-sm z-20 border border-gray-200">
            <p className="text-gray-600 flex items-center font-medium">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              Click map or drag marker to select location
            </p>
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="p-4 bg-primary/5 rounded-lg border">
          <h4 className="font-semibold mb-2">Selected Address:</h4>
          <p className="text-sm text-muted-foreground mb-2">{selectedAddress.formatted_address}</p>
          <p className="text-xs text-muted-foreground/70">
            Coordinates: {selectedAddress.lat.toFixed(6)}°, {selectedAddress.lng.toFixed(6)}°
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={confirmAddress} 
          disabled={!selectedAddress}
          className="bg-primary hover:bg-primary/90"
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}