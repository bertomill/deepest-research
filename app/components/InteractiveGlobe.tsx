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
  { name: 'Lagos', city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, emoji: '🇳🇬' },
  { name: 'São Paulo', city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, emoji: '🇧🇷' },
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

            // City label with connection point
            el.innerHTML = `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
              ">
                <div style="
                  background: rgba(0, 0, 0, 0.7);
                  backdrop-filter: blur(6px);
                  color: white;
                  padding: 3px 8px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                  white-space: nowrap;
                  user-select: none;
                " class="city-label">
                  <span style="margin-right: 3px;">${d.emoji}</span>
                  ${d.name}
                </div>
                <div style="
                  width: 1px;
                  height: 12px;
                  background: rgba(255, 255, 255, 0.4);
                " class="city-line"></div>
                <div style="
                  width: 6px;
                  height: 6px;
                  background: rgba(255, 255, 255, 0.9);
                  border-radius: 50%;
                  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                " class="city-point"></div>
              </div>
            `;

            el.addEventListener('click', () => handleQuickLocationClick(d));
            el.addEventListener('mouseenter', (e) => {
              const label = (e.currentTarget as HTMLElement).querySelector('.city-label') as HTMLElement;
              const point = (e.currentTarget as HTMLElement).querySelector('.city-point') as HTMLElement;
              label.style.transform = 'scale(1.1)';
              label.style.background = 'rgba(0, 0, 0, 0.9)';
              point.style.transform = 'scale(1.3)';
              point.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.8)';
            });
            el.addEventListener('mouseleave', (e) => {
              const label = (e.currentTarget as HTMLElement).querySelector('.city-label') as HTMLElement;
              const point = (e.currentTarget as HTMLElement).querySelector('.city-point') as HTMLElement;
              label.style.transform = 'scale(1)';
              label.style.background = 'rgba(0, 0, 0, 0.7)';
              point.style.transform = 'scale(1)';
              point.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.6)';
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
