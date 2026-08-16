/**
 * Haversine formula to calculate distance between two coordinates in km
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Robust zero-dependency GPX parser supporting both Browser (DOMParser) and Node/Serverless
 */
export function parseGpx(gpxString) {
    if (!gpxString || !gpxString.trim())
        return null;
    try {
        const rawPoints = [];
        let totalDist = 0;
        let minLat = 90;
        let maxLat = -90;
        let minLng = 180;
        let maxLng = -180;
        if (typeof DOMParser !== 'undefined') {
            // Browser DOMParser
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(gpxString, 'application/xml');
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                console.warn('GPX parse error:', parserError.textContent);
                return null;
            }
            const trkpts = xmlDoc.querySelectorAll('trkpt');
            const pointsNodeList = trkpts.length > 0 ? trkpts : xmlDoc.querySelectorAll('rtept');
            if (pointsNodeList.length === 0)
                return null;
            for (let i = 0; i < pointsNodeList.length; i++) {
                const node = pointsNodeList[i];
                const latStr = node.getAttribute('lat');
                const lonStr = node.getAttribute('lon');
                if (!latStr || !lonStr)
                    continue;
                const lat = parseFloat(latStr);
                const lng = parseFloat(lonStr);
                if (isNaN(lat) || isNaN(lng))
                    continue;
                if (lat < minLat)
                    minLat = lat;
                if (lat > maxLat)
                    maxLat = lat;
                if (lng < minLng)
                    minLng = lng;
                if (lng > maxLng)
                    maxLng = lng;
                let ele = undefined;
                const eleNode = node.querySelector('ele');
                if (eleNode && eleNode.textContent) {
                    const parsedEle = parseFloat(eleNode.textContent);
                    if (!isNaN(parsedEle))
                        ele = parsedEle;
                }
                let time = undefined;
                const timeNode = node.querySelector('time');
                if (timeNode && timeNode.textContent) {
                    const parsedTime = new Date(timeNode.textContent);
                    if (!isNaN(parsedTime.getTime()))
                        time = parsedTime;
                }
                let hr = undefined;
                const hrNode = node.querySelector('hr, gpxtpx\\:hr');
                if (hrNode && hrNode.textContent) {
                    const parsedHr = parseInt(hrNode.textContent, 10);
                    if (!isNaN(parsedHr))
                        hr = parsedHr;
                }
                let cad = undefined;
                const cadNode = node.querySelector('cad, gpxtpx\\:cad');
                if (cadNode && cadNode.textContent) {
                    const parsedCad = parseInt(cadNode.textContent, 10);
                    if (!isNaN(parsedCad))
                        cad = parsedCad;
                }
                if (rawPoints.length > 0) {
                    const prev = rawPoints[rawPoints.length - 1];
                    const stepDist = calculateHaversineDistance(prev.lat, prev.lng, lat, lng);
                    totalDist += stepDist;
                }
                rawPoints.push({
                    lat,
                    lng,
                    ele,
                    time,
                    hr,
                    cad,
                    distFromStart: totalDist,
                });
            }
        }
        else {
            // Node/Universal Regex extraction fallback
            const trkptRegex = /<(?:trkpt|rtept)[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
            let match;
            while ((match = trkptRegex.exec(gpxString)) !== null) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                const inner = match[3];
                if (isNaN(lat) || isNaN(lng))
                    continue;
                if (lat < minLat)
                    minLat = lat;
                if (lat > maxLat)
                    maxLat = lat;
                if (lng < minLng)
                    minLng = lng;
                if (lng > maxLng)
                    maxLng = lng;
                const eleMatch = /<ele>([^<]+)<\/ele>/i.exec(inner);
                const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined;
                const timeMatch = /<time>([^<]+)<\/time>/i.exec(inner);
                const time = timeMatch ? new Date(timeMatch[1]) : undefined;
                const hrMatch = /<(?:gpxtpx:)?hr>([^<]+)<\/(?:gpxtpx:)?hr>/i.exec(inner);
                const hr = hrMatch ? parseInt(hrMatch[1], 10) : undefined;
                const cadMatch = /<(?:gpxtpx:)?cad>([^<]+)<\/(?:gpxtpx:)?cad>/i.exec(inner);
                const cad = cadMatch ? parseInt(cadMatch[1], 10) : undefined;
                if (rawPoints.length > 0) {
                    const prev = rawPoints[rawPoints.length - 1];
                    const stepDist = calculateHaversineDistance(prev.lat, prev.lng, lat, lng);
                    totalDist += stepDist;
                }
                rawPoints.push({
                    lat,
                    lng,
                    ele,
                    time,
                    hr,
                    cad,
                    distFromStart: totalDist,
                });
            }
        }
        if (rawPoints.length < 2)
            return null;
        const coordinates = rawPoints.map((p) => [p.lat, p.lng]);
        const elevations = rawPoints.map((p) => p.ele ?? 0);
        const timestamps = rawPoints.map((p) => (p.time ? p.time.toISOString() : ''));
        const elevationPoints = [];
        const sampleRate = Math.max(1, Math.floor(rawPoints.length / 100));
        for (let i = 0; i < rawPoints.length; i += sampleRate) {
            const p = rawPoints[i];
            elevationPoints.push({
                distance_km: Number(p.distFromStart.toFixed(2)),
                elevation_m: p.ele ? Math.round(p.ele) : 0,
                heart_rate: p.hr,
                cadence: p.cad,
            });
        }
        const lastRaw = rawPoints[rawPoints.length - 1];
        if (elevationPoints[elevationPoints.length - 1]?.distance_km !== Number(lastRaw.distFromStart.toFixed(2))) {
            elevationPoints.push({
                distance_km: Number(lastRaw.distFromStart.toFixed(2)),
                elevation_m: lastRaw.ele ? Math.round(lastRaw.ele) : 0,
                heart_rate: lastRaw.hr,
                cadence: lastRaw.cad,
            });
        }
        const splits = calculateSplits(rawPoints);
        return {
            coordinates,
            elevations,
            timestamps,
            bounds: [
                [minLat, minLng],
                [maxLat, maxLng],
            ],
            elevationPoints,
            splits,
            startPoint: coordinates[0],
            finishPoint: coordinates[coordinates.length - 1],
            totalGpxDistanceKm: Number(totalDist.toFixed(2)),
        };
    }
    catch (err) {
        console.error('Error parsing GPX:', err);
        return null;
    }
}
function calculateSplits(points) {
    if (points.length < 2)
        return [];
    const splits = [];
    let currentKmTarget = 1.0;
    let splitStartIndex = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.distFromStart >= currentKmTarget || i === points.length - 1) {
            const startP = points[splitStartIndex];
            const endP = p;
            const splitDist = endP.distFromStart - startP.distFromStart;
            let paceSeconds = 0;
            let eleDiff = 0;
            if (startP.time && endP.time) {
                const timeDiffSec = (endP.time.getTime() - startP.time.getTime()) / 1000;
                if (splitDist > 0 && timeDiffSec > 0) {
                    paceSeconds = Math.round(timeDiffSec / splitDist);
                }
            }
            if (startP.ele !== undefined && endP.ele !== undefined) {
                eleDiff = Math.round(endP.ele - startP.ele);
            }
            if (paceSeconds <= 0 || paceSeconds > 1800) {
                paceSeconds = 330;
            }
            const kmLabel = i === points.length - 1 && p.distFromStart < currentKmTarget
                ? Number(p.distFromStart.toFixed(2))
                : Math.round(currentKmTarget);
            splits.push({
                km: kmLabel,
                pace_seconds: paceSeconds,
                elevation_diff_m: eleDiff,
            });
            splitStartIndex = i;
            currentKmTarget += 1.0;
        }
    }
    return splits;
}
export function generateRouteSvgPath(coordinates, width = 80, height = 60, padding = 8) {
    if (!coordinates || coordinates.length < 2)
        return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of coordinates) {
        if (lat < minLat)
            minLat = lat;
        if (lat > maxLat)
            maxLat = lat;
        if (lng < minLng)
            minLng = lng;
        if (lng > maxLng)
            maxLng = lng;
    }
    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;
    const scale = Math.min(drawW / lngSpan, drawH / latSpan);
    const offsetX = padding + (drawW - lngSpan * scale) / 2;
    const offsetY = padding + (drawH - latSpan * scale) / 2;
    const project = ([lat, lng]) => {
        const x = offsetX + (lng - minLng) * scale;
        const y = offsetY + (maxLat - lat) * scale;
        return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    };
    const pts = coordinates.map(project);
    const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    return {
        pathData,
        startPoint: pts[0],
        endPoint: pts[pts.length - 1],
    };
}
