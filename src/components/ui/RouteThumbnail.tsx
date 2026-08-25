import React, { useMemo } from 'react';
import { generateRouteSvgPath } from '../../utils/gpx';
import type { RouteData } from '../../types/run';
import { MapPin, Zap } from 'lucide-react';

interface RouteThumbnailProps {
  routeData?: RouteData | null;
  workoutType?: 'outdoor' | 'indoor';
  className?: string;
  width?: number;
  height?: number;
}

export const RouteThumbnail: React.FC<RouteThumbnailProps> = ({
  routeData,
  workoutType = 'outdoor',
  className = '',
  width = 64,
  height = 52,
}) => {
  const svgInfo = useMemo(() => {
    if (!routeData?.coordinates || routeData.coordinates.length < 2) return null;
    return generateRouteSvgPath(routeData.coordinates, width, height, 6);
  }, [routeData, width, height]);

  if (!svgInfo) {
    if (workoutType === 'indoor') {
      return (
        <div
          style={{ width, height }}
          className={`bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 ${className}`}
          title="Indoor Running"
        >
          <Zap className="w-5 h-5 opacity-80 fill-blue-400/20" />
        </div>
      );
    }
    return (
      <div
        style={{ width, height }}
        className={`bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-300 shrink-0 ${className}`}
      >
        <MapPin className="w-5 h-5 opacity-40 text-neutral-400" />
      </div>
    );
  }

  return (
    <div
      style={{ width, height }}
      className={`bg-[#F9FAFB] border border-neutral-100 rounded-2xl flex items-center justify-center p-1 relative overflow-hidden shrink-0 shadow-inner ${className}`}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <path
          d={svgInfo.pathData}
          fill="none"
          stroke="#FF5500"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
        />
        <path
          d={svgInfo.pathData}
          fill="none"
          stroke="#FF5500"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={svgInfo.startPoint[0]} cy={svgInfo.startPoint[1]} r="2.8" fill="#16A34A" />
        <circle cx={svgInfo.endPoint[0]} cy={svgInfo.endPoint[1]} r="2.8" fill="#DC2626" />
      </svg>
    </div>
  );
};
