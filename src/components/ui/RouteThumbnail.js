import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { generateRouteSvgPath } from '../../utils/gpx';
import { MapPin } from 'lucide-react';
export const RouteThumbnail = ({ routeData, className = '', width = 64, height = 52, }) => {
    const svgInfo = useMemo(() => {
        if (!routeData?.coordinates || routeData.coordinates.length < 2)
            return null;
        return generateRouteSvgPath(routeData.coordinates, width, height, 6);
    }, [routeData, width, height]);
    if (!svgInfo) {
        return (_jsx("div", { style: { width, height }, className: `bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-300 shrink-0 ${className}`, children: _jsx(MapPin, { className: "w-5 h-5 opacity-40" }) }));
    }
    return (_jsx("div", { style: { width, height }, className: `bg-[#F9FAFB] border border-neutral-100 rounded-2xl flex items-center justify-center p-1 relative overflow-hidden shrink-0 shadow-inner ${className}`, children: _jsxs("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, className: "w-full h-full", children: [_jsx("path", { d: svgInfo.pathData, fill: "none", stroke: "#FF5500", strokeWidth: "3.5", strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.2" }), _jsx("path", { d: svgInfo.pathData, fill: "none", stroke: "#FF5500", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: svgInfo.startPoint[0], cy: svgInfo.startPoint[1], r: "2.8", fill: "#16A34A" }), _jsx("circle", { cx: svgInfo.endPoint[0], cy: svgInfo.endPoint[1], r: "2.8", fill: "#DC2626" })] }) }));
};
