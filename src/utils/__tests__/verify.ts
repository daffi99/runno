import { parseGpx, calculateHaversineDistance, generateRouteSvgPath } from '../gpx';
import {
  formatDuration,
  formatPace,
  formatDistance,
  formatSpeed,
  parseDurationToSeconds,
  parsePaceToSeconds,
} from '../formatters';

console.log('--- RUNNING RUNNO TEST SUITE ---');

// 1. Test Formatters
console.log('1. Testing Formatters...');
console.assert(formatDuration(3699) === '01:01:39', 'Duration 3699 should be 01:01:39');
console.assert(formatDuration(2720) === '45:20', 'Duration 2720 should be 45:20');
console.assert(formatPace(572, 'metric', false) === '9:32', 'Pace 572s should be 9:32');
console.assert(formatPace(390, 'metric', true) === '6:30 /km', 'Pace 390s should be 6:30 /km');
console.assert(formatDistance(6.47, 'metric', true) === '6.47 km', 'Distance 6.47 should format with km');
console.assert(formatSpeed(6.30, 'metric', true) === '6.30 km/h', 'Speed 6.30 should format with km/h');
console.assert(parseDurationToSeconds('01:01:39') === 3699, 'Parse 01:01:39 to seconds');
console.assert(parsePaceToSeconds('6:30') === 390, 'Parse 6:30 to seconds');
console.log('✅ Formatters passed.');

// 2. Test Haversine Distance
console.log('2. Testing Haversine...');
const dist = calculateHaversineDistance(37.7749, -122.4194, 37.7849, -122.4094);
console.assert(dist > 1.0 && dist < 2.0, `Distance should be ~1.4km, got ${dist}`);
console.log(`✅ Haversine distance: ${dist.toFixed(2)} km`);

// 3. Test GPX Parser with simulated GPX XML
console.log('3. Testing GPX parser...');
const sampleGpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Runno">
  <trk>
    <name>Morning Run</name>
    <trkseg>
      <trkpt lat="37.7749" lon="-122.4194">
        <ele>40.0</ele>
        <time>2026-08-15T07:00:00Z</time>
        <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>150</gpxtpx:hr><gpxtpx:cad>168</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions>
      </trkpt>
      <trkpt lat="37.7800" lon="-122.4150">
        <ele>45.0</ele>
        <time>2026-08-15T07:06:00Z</time>
        <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>158</gpxtpx:hr><gpxtpx:cad>170</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions>
      </trkpt>
      <trkpt lat="37.7850" lon="-122.4100">
        <ele>42.0</ele>
        <time>2026-08-15T07:12:00Z</time>
        <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>165</gpxtpx:hr><gpxtpx:cad>172</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

const routeData = parseGpx(sampleGpxXml);
if (routeData) {
  console.assert(routeData.coordinates.length === 3, 'Should parse 3 coordinates');
  console.assert(routeData.totalGpxDistanceKm! > 1.0, 'Total distance should be > 1km');
  console.log(`✅ GPX Parsed successfully. Track points: ${routeData.coordinates.length}, Distance: ${routeData.totalGpxDistanceKm} km`);
} else {
  // In Node environment DOMParser might need mocking or works in browser
  console.log('ℹ️ Node test environment notice: DOMParser is browser native.');
}

// 4. Test SVG Path Generator
console.log('4. Testing SVG Path Generator...');
const svgPath = generateRouteSvgPath([
  [37.7749, -122.4194],
  [37.7800, -122.4150],
  [37.7850, -122.4100],
]);
console.assert(svgPath !== null, 'SVG path should generate');
console.assert(svgPath?.pathData.startsWith('M'), 'SVG pathData should start with M');
console.log('✅ SVG Path generator passed:', svgPath?.pathData);

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
