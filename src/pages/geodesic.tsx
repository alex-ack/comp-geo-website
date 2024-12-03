import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NotebookPage from '../components/NotebookPage';

interface Point3D {
  x: number;
  y: number;
  z: number;
  phi: number;
  theta: number;
}

interface GeodesicResult {
  path: Point3D[];
  length: number;
  straightDistance: number;
  startCoords: { lat: number; lon: number };
  endCoords: { lat: number; lon: number };
}

const codeExample = `from typing import List, Tuple
import numpy as np

class SphericalPoint:
    """A point on a sphere in both Cartesian and spherical coordinates."""
    def __init__(self, lat: float, lon: float, radius: float = 1.0):
        """
        Initialize point using latitude and longitude (in radians).
        
        Args:
            lat: Latitude in [-π/2, π/2]
            lon: Longitude in [-π, π]
            radius: Sphere radius (default unit sphere)
        """
        self.lat = lat
        self.lon = lon
        self.r = radius
        
        # Compute Cartesian coordinates
        cos_lat = np.cos(lat)
        self.x = radius * cos_lat * np.cos(lon)
        self.y = radius * cos_lat * np.sin(lon)
        self.z = radius * np.sin(lat)

class Geodesic:
    """Compute and represent geodesics on a sphere."""
    
    def __init__(self, radius: float = 1.0):
        """Initialize with sphere radius."""
        self.radius = radius
    
    def distance(self, p1: SphericalPoint, p2: SphericalPoint) -> float:
        """
        Compute great circle distance between two points.
        
        Uses Vincenty formula for numerical stability:
        cos(c) = sin(φ₁)sin(φ₂) + cos(φ₁)cos(φ₂)cos(λ₂-λ₁)
        
        Args:
            p1, p2: SphericalPoints
            
        Returns:
            Distance along great circle
        """
        # Unpack coordinates
        lat1, lon1 = p1.lat, p1.lon
        lat2, lon2 = p2.lat, p2.lon
        
        # Compute using spherical law of cosines with Vincenty formula
        delta_lon = lon2 - lon1
        
        sin_lat1 = np.sin(lat1)
        sin_lat2 = np.sin(lat2)
        cos_lat1 = np.cos(lat1)
        cos_lat2 = np.cos(lat2)
        cos_dlon = np.cos(delta_lon)
        
        # Compute central angle
        cos_central = sin_lat1 * sin_lat2 + cos_lat1 * cos_lat2 * cos_dlon
        
        # Handle numerical precision
        cos_central = min(1.0, max(-1.0, cos_central))
        
        return self.radius * np.arccos(cos_central)
    
    def generate_path(self, p1: SphericalPoint, p2: SphericalPoint, 
                     num_points: int = 100) -> List[SphericalPoint]:
        """
        Generate points along the geodesic path.
        
        Uses spherical linear interpolation (SLERP):
        v = sin((1-t)θ)v₁ + sin(tθ)v₂ / sin(θ)
        where θ is the angle between points
        
        Args:
            p1, p2: Start and end points
            num_points: Number of points to generate
            
        Returns:
            List of points along the geodesic
        """
        # Convert to Cartesian vectors
        v1 = np.array([p1.x, p1.y, p1.z])
        v2 = np.array([p2.x, p2.y, p2.z])
        
        # Compute angle between vectors
        cos_theta = np.dot(v1, v2) / (self.radius ** 2)
        cos_theta = min(1.0, max(-1.0, cos_theta))  # Numerical stability
        theta = np.arccos(cos_theta)
        
        # Handle special cases
        if np.abs(theta) < 1e-10:  # Points are very close
            return [p1, p2]
        if np.abs(theta - np.pi) < 1e-10:  # Antipodal points
            raise ValueError("Antipodal points have infinite geodesics")
            
        # Generate points using SLERP
        path = []
        for i in range(num_points):
            t = i / (num_points - 1)
            sin_theta = np.sin(theta)
            
            # SLERP formula
            a = np.sin((1-t) * theta) / sin_theta
            b = np.sin(t * theta) / sin_theta
            
            # Interpolated vector
            v = a * v1 + b * v2
            
            # Convert back to spherical coordinates
            r = np.sqrt(np.sum(v**2))
            lat = np.arcsin(v[2] / r)
            lon = np.arctan2(v[1], v[0])
            
            path.append(SphericalPoint(lat, lon, self.radius))
            
        return path
    
    def initial_bearing(self, p1: SphericalPoint, p2: SphericalPoint) -> float:
        """
        Compute initial bearing from p1 to p2.
        
        Uses the formula:
        θ = atan2(sin(Δλ)cos(φ₂), 
                  cos(φ₁)sin(φ₂) - sin(φ₁)cos(φ₂)cos(Δλ))
        
        Returns:
            Bearing in radians from true north
        """
        delta_lon = p2.lon - p1.lon
        
        y = np.sin(delta_lon) * np.cos(p2.lat)
        x = np.cos(p1.lat) * np.sin(p2.lat) - \
            np.sin(p1.lat) * np.cos(p2.lat) * np.cos(delta_lon)
            
        return np.arctan2(y, x) % (2 * np.pi)`;

const SPHERE_RADIUS = 150;
const EARTH_RADIUS = 6371; // km

const radToDeg = (rad: number) => (rad * 180) / Math.PI;

const GeodesicPage: React.FC = () => {
  
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('concept');
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [geodesic, setGeodesic] = useState<GeodesicResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const cleanup = useCallback(() => {
    setIsDragging(false);
    setSelectedPoints([]);
    setGeodesic(null);
    setRotation({ x: 0, y: 0 });
    setLastMousePos({ x: 0, y: 0 });
  }, []);

  // Effect for handling route changes
  useEffect(() => {
    const currentPath = location.pathname;
    return () => {
      if (location.pathname !== currentPath) {
        cleanup();
      }
    };
  }, [location, cleanup]);

  // Effect for handling unmounting
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const generateSpherePoints = useCallback((): Point3D[] => {
    const points: Point3D[] = [];
    const segments = 12;

    for (let lat = -90; lat <= 90; lat += 180 / segments) {
      for (let lon = -180; lon < 180; lon += 360 / segments) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (180 - lon) * Math.PI / 180;

        const x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
        const z = SPHERE_RADIUS * Math.cos(phi);

        points.push({ x, y, z, phi, theta });
      }
    }
    return points;
  }, []);

  const rotatePoint = useCallback((point: Point3D) => {
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    const y1 = point.y;
    const z1 = point.z * cosY - point.x * sinY;
    const x1 = point.z * sinY + point.x * cosY;

    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    const scale = 400 / (400 + z2);
    return {
      x: 250 + x1 * scale,
      y: 250 + y2 * scale,
    };
  }, [rotation]);

  const computeSphericalGeodesic = useCallback((startPoint: Point3D, endPoint: Point3D): GeodesicResult => {
    const steps = 50;
    const path: Point3D[] = [];

    const dot = (startPoint.x * endPoint.x + startPoint.y * endPoint.y + startPoint.z * endPoint.z) / 
                (SPHERE_RADIUS * SPHERE_RADIUS);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const subAngle = angle * t;

      const sinSubAngle = Math.sin(subAngle);
      const sinComplAngle = Math.sin(angle - subAngle);
      const sinAngle = Math.sin(angle);

      const x = (startPoint.x * sinComplAngle + endPoint.x * sinSubAngle) / sinAngle;
      const y = (startPoint.y * sinComplAngle + endPoint.y * sinSubAngle) / sinAngle;
      const z = (startPoint.z * sinComplAngle + endPoint.z * sinSubAngle) / sinAngle;

      path.push({ x, y, z, phi: 0, theta: 0 });
    }

    const length = SPHERE_RADIUS * angle;
    const straightDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2) +
      Math.pow(endPoint.z - startPoint.z, 2)
    );

    const startLat = radToDeg(Math.PI / 2 - startPoint.phi);
    const startLon = radToDeg(Math.PI - startPoint.theta);
    const endLat = radToDeg(Math.PI / 2 - endPoint.phi);
    const endLon = radToDeg(Math.PI - endPoint.theta);

    const scaleFactor = EARTH_RADIUS / SPHERE_RADIUS;
    const lengthKm = length * scaleFactor;
    const straightDistanceKm = straightDistance * scaleFactor;

    return { 
      path, 
      length: lengthKm,
      straightDistance: straightDistanceKm,
      startCoords: { lat: startLat, lon: startLon },
      endCoords: { lat: endLat, lon: endLon },
    };
  }, []);

  const basePoints = generateSpherePoints();
  const points = basePoints.map(rotatePoint);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setRotation((prev) => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setSelectedPoints((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        if (prev.length < 2) {
          return [...prev, index];
        }
        return [index];
      });
    }
  }, [isDragging]);

  useEffect(() => {
    if (selectedPoints.length === 2) {
      const start = basePoints[selectedPoints[0]];
      const end = basePoints[selectedPoints[1]];
      if (start && end) {
        const result = computeSphericalGeodesic(start, end);
        setGeodesic(result);
      }
    } else {
      setGeodesic(null);
    }
  }, [selectedPoints, basePoints, computeSphericalGeodesic]);

  useEffect(() => {
    cleanup();
    return cleanup;
  }, [activeTab, cleanup]);

  if (location.pathname !== '/geodesic') {
    return null;
  }

  return (
    <NotebookPage
      title="Geodesics on a Sphere"
      description="Understand and interact with geodesics on spherical surfaces."
    >
      <div className="w-full">
        <div className="flex space-x-2 border-b mb-6">
          <button
            className={`px-4 py-2 ${
              activeTab === 'concept'
                ? 'border-b-2 border-blue-500 font-medium'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('concept')}
          >
            Concept
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'implementation'
                ? 'border-b-2 border-blue-500 font-medium'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('implementation')}
          >
            Implementation
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'interactive'
                ? 'border-b-2 border-blue-500 font-medium'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('interactive')}
          >
            Interactive Demo
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'concept' && (
            <div>
            <h3 className="text-xl font-semibold mb-3">Understanding Geodesics</h3>
            
            {/* Core Definition with Visualization */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                A geodesic is the shortest path between two points on a surface, while staying on that surface. They are 
                the natural extension of straight lines to curved spaces, revealing fundamental properties about a surface's 
                geometry and curvature. Their behavior changes dramatically based on the surface they traverse.
              </p>
          
              {/* Side-by-side visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Flat vs Curved Space</h4>
                  <svg viewBox="0 0 300 200" className="w-full h-48 bg-white mb-2">
                    {/* Left side - flat plane */}
                    <line x1="20" y1="30" x2="130" y2="170" 
                          stroke="#3B82F6" strokeWidth="2"/>
                    <text x="75" y="20" className="text-sm" fill="#3B82F6">Straight Line</text>
                    
                    {/* Right side - curved surface */}
                    <path d="M170,30 Q270,100 170,170" 
                          fill="none" stroke="#EF4444" strokeWidth="2"/>
                    <text x="220" y="20" className="text-sm" fill="#EF4444">Geodesic</text>
                  </svg>
                  <p className="text-sm text-gray-600">Left: Flat space, Right: Curved space</p>
                </div>
          
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Different Surface Types</h4>
                  <svg viewBox="0 0 300 200" className="w-full h-48 bg-white mb-2">
                    {/* Sphere */}
                    <circle cx="80" cy="100" r="60" 
                            fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                    <ellipse cx="80" cy="100" rx="60" ry="60" 
                             fill="none" stroke="#3B82F6" strokeWidth="2"/>
                    
                    {/* Cylinder */}
                    <path d="M180,40 L180,160 A30,30 0 0,0 240,160 L240,40 A30,30 0 0,0 180,40"
                          fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                    <path d="M180,40 Q210,100 240,160" 
                          fill="none" stroke="#22C55E" strokeWidth="2"/>
                  </svg>
                  <p className="text-sm text-gray-600">Geodesics on sphere and cylinder</p>
                </div>
              </div>
            </div>
          
            {/* Key Properties */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-3">Key Properties</h4>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h5 className="font-medium text-black">Local Properties:</h5>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Zero geodesic curvature at every point</li>
                    <li>Locally minimizes distance between any two points</li>
                    <li>Follows path of zero acceleration on the surface</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-black">Global Properties:</h5>
                  <ul className="list-disc pl-5 mt-2">
                    <li>May not be unique - multiple geodesics can connect two points</li>
                    <li>Can intersect themselves or other geodesics</li>
                    <li>Always longer than the straight-line distance through space</li>
                  </ul>
                </div>
              </div>
            </div>
          
            {/* Examples */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Examples on Different Surfaces</h4>
              <ul className="list-disc pl-5 space-y-3 text-gray-700">
                <li>
                  <strong>Plane:</strong> Straight lines
                </li>
                <li>
                  <strong>Sphere:</strong> Great circles (like the equator)
                </li>
                <li>
                  <strong>Cylinder:</strong> Helices with constant angle
                </li>
                <li>
                  <strong>Torus:</strong> Complex curves that can densely fill the surface
                </li>
              </ul>
            </div>
          </div>
          )}

{activeTab === 'implementation' && (
  <div className="space-y-8">
    <section>
      <h3 className="text-xl font-semibold mb-3">Computing Spherical Geodesics</h3>
      
      {/* Core Implementation */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <pre className="overflow-x-auto">
          <code>{codeExample}</code>
        </pre>
      </div>

      {/* Mathematical Foundation */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-4">Mathematical Foundation (because I think it's confusing)</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Spherical Coordinates</h5>
            <p className="text-gray-700 mb-2">
              Points on a sphere are represented using:
            </p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>φ (phi): latitude [-π/2, π/2]</li>
              <li>λ (lambda): longitude [-π, π]</li>
              <li>r: sphere radius (constant)</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium mb-2">Great Circle Distance</h5>
            <p className="text-gray-700 mb-2">
              The distance along a great circle is computed using the spherical law of cosines:
            </p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>d = r · arccos(sin φ₁ sin φ₂ + cos φ₁ cos φ₂ cos(Δλ))</li>
              <li>For numerical stability, we use the Haversine formula for small distances</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium mb-2">Path Generation</h5>
            <p className="text-gray-700">
              To generate points along the geodesic:
            </p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Use spherical linear interpolation (SLERP)</li>
              <li>Maintain constant angular velocity</li>
              <li>Handle numerical precision near poles</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Numerical Considerations */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-4">Implementation Details</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Numerical Stability</h5>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Use stable formula for small angles</li>
              <li>Handle antipodal points (opposite sides)</li>
              <li>Account for floating-point precision</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium mb-2">Edge Cases</h5>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Points near poles</li>
              <li>Points near the date line</li>
              <li>Very short/long distances</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
)}

          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div
                className="relative h-96 bg-gray-50 border border-gray-200 rounded-lg cursor-move"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <svg width="100%" height="100%" viewBox="0 0 500 500">
                  {points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r={selectedPoints.includes(index) ? 6 : 4}
                      fill={selectedPoints.includes(index) ? "#ef4444" : "#3b82f6"}
                      opacity={rotatePoint(basePoints[index]).y > 250 ? 1 : 0.3}
                      onClick={(e) => handlePointClick(index, e)}
                      className={`cursor-pointer hover:opacity-80 ${
                        isDragging ? "" : "hover:r-6"
                      }`}
                    />
                  ))}

                  {geodesic?.path && (
                    <path
                      d={geodesic.path
                        .map((p, i) => {
                          const point = rotatePoint(p);
                          return `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`;
                        })
                        .join(" ")}
                      stroke="#22c55e"
                      strokeWidth="2"
                      fill="none"
                    />
                  )}
                </svg>
              </div>
              {geodesic && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">Geodesic Details</h4>
                  <p>Start: {geodesic.startCoords.lat.toFixed(2)}°, {geodesic.startCoords.lon.toFixed(2)}°</p>
                  <p>End: {geodesic.endCoords.lat.toFixed(2)}°, {geodesic.endCoords.lon.toFixed(2)}°</p>
                  <p>Geodesic Length: {geodesic.length.toFixed(2)} km</p>
                  <p>Straight Distance: {geodesic.straightDistance.toFixed(2)} km</p>
                  <p>
                    Difference: {(
                      ((geodesic.length - geodesic.straightDistance) /
                        geodesic.straightDistance) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default GeodesicPage;