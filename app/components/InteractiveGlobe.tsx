'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe to avoid SSR issues
const GlobeComponent = dynamic(() => import('react-globe.gl'), {
  ssr: false,
});

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

interface InteractiveGlobeProps {
  onLocationSelect: (location: LocationData) => void;
}

// Predefined major business hubs
const QUICK_LOCATIONS = [
  { name: 'New York', city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, emoji: '🗽' },
  { name: 'London', city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, emoji: '🇬🇧' },
  { name: 'Tokyo', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, emoji: '🗼' },
  { name: 'Singapore', city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, emoji: '🇸🇬' },
  { name: 'Bangalore', city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946, emoji: '🇮🇳' },
  { name: 'San Francisco', city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, emoji: '🌉' },
];

export default function InteractiveGlobe({ onLocationSelect }: InteractiveGlobeProps) {
  const globeEl = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, [isClient]);

  const handleQuickLocationClick = (location: typeof QUICK_LOCATIONS[0]) => {
    // Stop auto-rotation
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      // Optionally point camera to location
      globeEl.current.pointOfView({ lat: location.lat, lng: location.lng, altitude: 1.5 }, 1000);
    }

    // Directly pass the location data
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      city: location.city,
      country: location.country,
    });
  };

  const handleGlobeClick = async (coords: any) => {
    if (!coords) return;

    const { lat, lng } = coords;

    // Stop auto-rotation on click
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }

    // Reverse geocode to get location name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      const locationData: LocationData = {
        lat,
        lng,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
      };

      onLocationSelect(locationData);
    } catch (error) {
      console.error('Error geocoding:', error);
      // Still pass the coordinates even if geocoding fails
      onLocationSelect({ lat, lng });
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading globe...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Globe with integrated labels */}
      <div className="relative h-[600px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <GlobeComponent
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeClick={handleGlobeClick}
          width={typeof window !== 'undefined' ? window.innerWidth * 0.9 : 800}
          height={600}
          atmosphereColor="lightskyblue"
          atmosphereAltitude={0.15}
          // Add city markers only
          htmlElementsData={QUICK_LOCATIONS}
          htmlElement={(d: any) => {
            const el = document.createElement('div');

            // City label
            el.innerHTML = `
              <div style="
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                color: white;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.2s;
                white-space: nowrap;
                user-select: none;
              " class="city-marker">
                <span style="margin-right: 4px;">${d.emoji}</span>
                ${d.name}
              </div>
            `;

            el.addEventListener('click', () => handleQuickLocationClick(d));
            el.addEventListener('mouseenter', (e) => {
              const marker = (e.currentTarget as HTMLElement).querySelector('.city-marker') as HTMLElement;
              marker.style.transform = 'scale(1.1)';
              marker.style.background = 'rgba(0, 0, 0, 0.9)';
              marker.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            });
            el.addEventListener('mouseleave', (e) => {
              const marker = (e.currentTarget as HTMLElement).querySelector('.city-marker') as HTMLElement;
              marker.style.transform = 'scale(1)';
              marker.style.background = 'rgba(0, 0, 0, 0.75)';
              marker.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            });

            el.style.pointerEvents = 'auto';
            el.style.cursor = 'pointer';

            return el;
          }}
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-xs text-white backdrop-blur-sm sm:text-sm">
          Click on cities to explore research topics
        </div>
      </div>
    </div>
  );
}
