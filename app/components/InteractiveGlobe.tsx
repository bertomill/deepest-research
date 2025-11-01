'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

// Dynamically import Globe to avoid SSR issues
const GlobeComponent = dynamic(() => import('react-globe.gl'), {
  ssr: false,
});

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  planet?: string; // Added for planet identification
}

interface InteractiveGlobeProps {
  onLocationSelect: (location: LocationData) => void;
}

interface PlanetData {
  id: string;
  name: string;
  emoji: string;
  lat: number;
  lng: number;
  altitude: number;
  color: string;
  size: number;
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

// Celestial bodies for space industry research
const PLANETS: PlanetData[] = [
  { id: 'moon', name: 'Moon', emoji: '🌙', lat: 45, lng: 45, altitude: 0.8, color: '#cccccc', size: 0.15 },
  { id: 'mars', name: 'Mars', emoji: '🔴', lat: -30, lng: 120, altitude: 0.9, color: '#cd5c5c', size: 0.18 },
  { id: 'jupiter', name: 'Jupiter', emoji: '🪐', lat: 20, lng: -90, altitude: 1.0, color: '#daa520', size: 0.25 },
];

export default function InteractiveGlobe({ onLocationSelect }: InteractiveGlobeProps) {
  const globeEl = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const planetMeshesRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;

      // Add planets to the scene
      const scene = globeEl.current.scene();

      PLANETS.forEach((planet) => {
        // Create planet mesh
        const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const material = new THREE.MeshPhongMaterial({
          color: planet.color,
          emissive: planet.color,
          emissiveIntensity: 0.3,
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Convert lat/lng/altitude to 3D position
        const phi = (90 - planet.lat) * (Math.PI / 180);
        const theta = (planet.lng + 180) * (Math.PI / 180);
        const radius = 100 * (1 + planet.altitude); // Earth globe radius is 100

        mesh.position.set(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );

        mesh.userData = { planet: planet.id, name: planet.name };
        planetMeshesRef.current.set(planet.id, mesh);
        scene.add(mesh);
      });
    }
  }, [isClient]);

  const handlePlanetClick = (planet: PlanetData) => {
    // Stop auto-rotation
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }

    // Pass planet data as location
    onLocationSelect({
      lat: 0,
      lng: 0,
      planet: planet.id,
      city: planet.name,
      country: 'Space',
    });
  };

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
    <div className="w-full space-y-4">
      {/* Quick Location Cards */}
      <div className="mb-4">
        <p className="mb-3 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Tap a city to discover research topics
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:justify-center lg:gap-3">
          {QUICK_LOCATIONS.map((location) => (
            <button
              key={location.name}
              onClick={() => handleQuickLocationClick(location)}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-zinc-900 hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="text-lg">{location.emoji}</span>
              <span>{location.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Planet Cards for Space Industry Research */}
      <div className="mb-4">
        <p className="mb-3 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Or explore space industry research
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {PLANETS.map((planet) => (
            <button
              key={planet.id}
              onClick={() => handlePlanetClick(planet)}
              className="flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-3 text-sm font-medium transition-all hover:border-purple-400 hover:from-purple-100 hover:to-indigo-100 active:scale-95 dark:border-purple-800 dark:from-purple-950 dark:to-indigo-950 dark:hover:border-purple-600"
            >
              <span className="text-lg">{planet.emoji}</span>
              <span>{planet.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Globe */}
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-xs text-white backdrop-blur-sm sm:text-sm">
          Or click anywhere on the globe
        </div>
      </div>
    </div>
  );
}
