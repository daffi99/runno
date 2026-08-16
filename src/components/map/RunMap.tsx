import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { RouteData } from '../../types/run';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MapPin, Maximize2 } from 'lucide-react';

interface RunMapProps {
  routeData?: RouteData | null;
  elevationGain?: number | null;
  elevationLoss?: number | null;
  height?: string;
  showElevationProfile?: boolean;
}

export const RunMap: React.FC<RunMapProps> = ({
  routeData,
  elevationGain,
  elevationLoss,
  height = '360px',
  showElevationProfile = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !routeData?.coordinates || routeData.coordinates.length < 2) {
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const latLngs: L.LatLngExpression[] = routeData.coordinates.map((c) => [c[0], c[1]]);

    L.polyline(latLngs, {
      color: '#FF5500',
      weight: 8,
      opacity: 0.25,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const polyline = L.polyline(latLngs, {
      color: '#FF5500',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const startCoord = routeData.coordinates[0];
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div style="
        width: 18px; 
        height: 18px; 
        background: #16A34A; 
        border: 3px solid #FFFFFF; 
        border-radius: 50%; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker([startCoord[0], startCoord[1]], { icon: startIcon }).addTo(map);

    const finishCoord = routeData.coordinates[routeData.coordinates.length - 1];
    const finishIcon = L.divIcon({
      className: 'custom-finish-marker',
      html: `<div style="
        width: 20px; 
        height: 20px; 
        background: #DC2626; 
        border: 3px solid #FFFFFF; 
        border-radius: 50%; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: white; border-radius: 1px;"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([finishCoord[0], finishCoord[1]], { icon: finishIcon }).addTo(map);

    map.fitBounds(polyline.getBounds(), {
      padding: [40, 40],
      maxZoom: 16,
    });
  }, [routeData]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && routeData?.coordinates) {
      const latLngs: L.LatLngExpression[] = routeData.coordinates.map((c) => [c[0], c[1]]);
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  if (!routeData?.coordinates || routeData.coordinates.length < 2) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-soft text-center my-4 flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF5500] mb-3.5">
          <MapPin className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-neutral-800 mb-1">No route attached</h3>
        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
          Add an optional GPX file when uploading or editing a run to view your GPS route, map, and elevation profile.
        </p>
      </div>
    );
  }

  const elevationData = routeData.elevationPoints || [];

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative rounded-3xl overflow-hidden shadow-soft border border-neutral-200/80 bg-[#f4f4f2]">
        <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-neutral-200/60 shadow-sm flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
          <span className="text-[11px] font-semibold text-neutral-700">Start</span>
          <span className="text-neutral-300">|</span>
          <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          <span className="text-[11px] font-semibold text-neutral-700">Finish</span>
        </div>

        <button
          onClick={handleRecenter}
          className="absolute bottom-3 right-3 z-[400] bg-white/90 backdrop-blur-md p-2 rounded-xl border border-neutral-200/60 shadow-sm hover:bg-white text-neutral-700 active:scale-95 transition-all"
          title="Recenter route"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {showElevationProfile && elevationData.length > 1 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Elevation</span>
              <div className="flex items-baseline space-x-4 mt-0.5">
                <div>
                  <span className="text-lg font-extrabold text-neutral-900">{elevationGain ?? 33}</span>
                  <span className="text-xs font-semibold text-neutral-500 ml-1">m</span>
                  <span className="text-[10px] text-neutral-400 block -mt-1">Gain</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-neutral-900">{elevationLoss ?? 35}</span>
                  <span className="text-xs font-semibold text-neutral-500 ml-1">m</span>
                  <span className="text-[10px] text-neutral-400 block -mt-1">Loss</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elevationData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5500" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5500" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distance_km"
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  unit=" km"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  unit=" m"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg">
                          <p className="font-bold">{data.elevation_m} m</p>
                          <p className="text-[10px] text-neutral-300">{data.distance_km} km</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elevation_m"
                  stroke="#FF5500"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#elevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
