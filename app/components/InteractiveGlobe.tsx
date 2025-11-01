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
    <div className="relative h-[500px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <GlobeComponent
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        onGlobeClick={handleGlobeClick}
        width={typeof window !== 'undefined' ? window.innerWidth * 0.9 : 800}
        height={500}
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
        Click anywhere on the globe to explore local news and research topics
      </div>
    </div>
  );
}
