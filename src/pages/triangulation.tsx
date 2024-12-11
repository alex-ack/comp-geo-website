import React, { useState, useCallback } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  vertices: Point[];
}

const Triangulation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'concept' | 'implementation' | 'interactive'>('concept');
  const [points, setPoints] = useState<Point[]>([]);
  const [triangles, setTriangles] = useState<Triangle[]>([]);

  const codeExample = `from typing import List, Tuple, Optional
import numpy as np

class Point:
    """A 2D point in Euclidean space."""
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

class GeometricCalculator:
    """Handles core geometric calculations with numerical stability considerations."""
    
    @staticmethod
    def cross_product(o: Point, a: Point, b: Point, epsilon: float = 1e-10) -> float:
        """
        Compute the z-component of the cross product of vectors OA and OB.
        
        This is equivalent to twice the signed area of triangle OAB:
        positive -> counterclockwise orientation
        negative -> clockwise orientation
        zero (within epsilon) -> collinear
        
        Args:
            o, a, b: Points forming vectors OA and OB
            epsilon: Numerical tolerance for floating-point comparisons
            
        Returns:
            float: The signed area multiplied by 2
        """
        area = (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
        return 0.0 if abs(area) < epsilon else area

    @staticmethod
    def point_in_triangle(p: Point, v1: Point, v2: Point, v3: Point, epsilon: float = 1e-10) -> bool:
        """
        Determine if point P lies inside triangle V1V2V3 using barycentric coordinates.
        
        Barycentric coordinates (α,β,γ) for point P satisfy:
        P = αV1 + βV2 + γV3, where α + β + γ = 1
        P is inside the triangle iff 0 ≤ α,β,γ ≤ 1
        """
        # Compute vectors
        v0 = Point(v3.x - v1.x, v3.y - v1.y)
        v1_vec = Point(v2.x - v1.x, v2.y - v1.y)
        v2_vec = Point(p.x - v1.x, p.y - v1.y)
        
        # Compute dot products
        dot00 = v0.x * v0.x + v0.y * v0.y
        dot01 = v0.x * v1_vec.x + v0.y * v1_vec.y
        dot02 = v0.x * v2_vec.x + v0.y * v2_vec.y
        dot11 = v1_vec.x * v1_vec.x + v1_vec.y * v1_vec.y
        dot12 = v1_vec.x * v2_vec.x + v1_vec.y * v2_vec.y
        
        # Compute barycentric coordinates
        inv_denom = 1.0 / (dot00 * dot11 - dot01 * dot01)
        u = (dot11 * dot02 - dot01 * dot12) * inv_denom
        v = (dot00 * dot12 - dot01 * dot02) * inv_denom
        
        # Check if point is inside triangle
        return (u >= -epsilon) and (v >= -epsilon) and (u + v <= 1 + epsilon)

class PolygonValidator:
    """Validates polygon properties and handles degenerate cases."""
    
    @staticmethod
    def is_simple_polygon(vertices: List[Point], epsilon: float = 1e-10) -> bool:
        """
        Check if the polygon is simple (no self-intersections).
        
        A polygon is simple if:
        1. No non-adjacent edges intersect
        2. Adjacent edges only intersect at their common vertex
        """
        n = len(vertices)
        if n < 3:
            return False
            
        # Check for edge intersections
        for i in range(n):
            i1 = (i + 1) % n
            for j in range(i + 2, n):
                j1 = (j + 1) % n
                if i == j1:
                    continue
                    
                if PolygonValidator._segments_intersect(
                    vertices[i], vertices[i1], 
                    vertices[j], vertices[j1], 
                    epsilon
                ):
                    return False
        return True

    @staticmethod
    def _segments_intersect(p1: Point, p2: Point, p3: Point, p4: Point, epsilon: float) -> bool:
        """
        Determine if line segments P1P2 and P3P4 intersect using cross products.
        """
        calc = GeometricCalculator()
        o1 = calc.cross_product(p1, p2, p3)
        o2 = calc.cross_product(p1, p2, p4)
        o3 = calc.cross_product(p3, p4, p1)
        o4 = calc.cross_product(p3, p4, p2)
        
        # Check for proper intersection
        if ((o1 > epsilon and o2 < -epsilon) or (o1 < -epsilon and o2 > epsilon)) and \
           ((o3 > epsilon and o4 < -epsilon) or (o3 < -epsilon and o4 > epsilon)):
            return True
            
        # Check for improper intersection (endpoint on segment)
        return abs(o1) < epsilon or abs(o2) < epsilon or abs(o3) < epsilon or abs(o4) < epsilon

class Triangulator:
    """
    Implements the ear-clipping algorithm for polygon triangulation.
    Time complexity: O(n²)
    Space complexity: O(n)
    """
    
    def __init__(self, epsilon: float = 1e-10):
        self.calc = GeometricCalculator()
        self.validator = PolygonValidator()
        self.epsilon = epsilon
        
    def triangulate(self, vertices: List[Point]) -> List[Tuple[Point, Point, Point]]:
        """
        Triangulate a simple polygon using the ear-clipping method.
        Returns list of triangles (each triangle is a tuple of three Points).
        """
        if len(vertices) < 3:
            raise ValueError("Polygon must have at least 3 vertices")
            
        if not self.validator.is_simple_polygon(vertices):
            raise ValueError("Polygon must be simple (no self-intersections)")
            
        remaining = vertices.copy()
        triangles = []
        
        while len(remaining) > 3:
            ear_idx = self._find_ear(remaining)
            if ear_idx is None:
                raise ValueError("Invalid polygon: no ear found")
                
            # Create triangle from ear
            prev_idx = (ear_idx - 1) % len(remaining)
            next_idx = (ear_idx + 1) % len(remaining)
            triangles.append((
                remaining[prev_idx],
                remaining[ear_idx],
                remaining[next_idx]
            ))
            
            remaining.pop(ear_idx)
        
        triangles.append((remaining[0], remaining[1], remaining[2]))
        return triangles
        
    def _find_ear(self, vertices: List[Point]) -> Optional[int]:
        """Find an ear vertex in the polygon using geometric tests."""
        n = len(vertices)
        for i in range(n):
            prev = vertices[(i - 1) % n]
            curr = vertices[i]
            next = vertices[(i + 1) % n]
            
            if self.calc.cross_product(prev, curr, next) <= self.epsilon:
                continue
                
            is_ear = True
            for j in range(n):
                if j in {(i - 1) % n, i, (i + 1) % n}:
                    continue
                    
                if self.calc.point_in_triangle(vertices[j], prev, curr, next):
                    is_ear = False
                    break
                    
            if is_ear:
                return i
                
        return None

def triangulate_polygon(vertices: List[Point]) -> List[Tuple[Point, Point, Point]]:
    """
    Convenient wrapper function for polygon triangulation.
    
    Example usage:
    vertices = [
        Point(0, 0), Point(2, 0), Point(2, 2),
        Point(1, 1), Point(0, 2)
    ]
    triangles = triangulate_polygon(vertices)
    """
    triangulator = Triangulator()
    return triangulator.triangulate(vertices)`;

  const earClipTriangulation = (polygon: Point[]): Triangle[] => {
    // Helper to determine if two line segments intersect
    const doSegmentsIntersect = (p1: Point, p2: Point, p3: Point, p4: Point): boolean => {
      const ccw = (A: Point, B: Point, C: Point): number => {
        return (C.y - A.y) * (B.x - A.x) - (B.y - A.y) * (C.x - A.x);
      };

      const a = ccw(p1, p2, p3);
      const b = ccw(p1, p2, p4);
      const c = ccw(p3, p4, p1);
      const d = ccw(p3, p4, p2);

      // Check if segments share an endpoint
      if (p1 === p3 || p1 === p4 || p2 === p3 || p2 === p4) {
        return false;
      }

      return (a * b < 0) && (c * d < 0);
    };

    const crossProduct = (o: Point, a: Point, b: Point): number => {
      return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    };

    const isValidDiagonal = (start: Point, end: Point, polygon: Point[]): boolean => {
      // Check if diagonal intersects any polygon edges
      for (let i = 0; i < polygon.length; i++) {
        const next = (i + 1) % polygon.length;
        
        // Skip edges that share vertices with the diagonal
        if (polygon[i] === start || polygon[i] === end || 
            polygon[next] === start || polygon[next] === end) {
          continue;
        }

        if (doSegmentsIntersect(start, end, polygon[i], polygon[next])) {
          return false;
        }
      }
      return true;
    };

    const isEar = (polygon: Point[], i: number): boolean => {
      const n = polygon.length;
      const prev = polygon[(i - 1 + n) % n];
      const curr = polygon[i];
      const next = polygon[(i + 1) % n];

      // Check orientation
      const cross = crossProduct(prev, curr, next);
      if (cross <= 0) return false;

      // Check if diagonal is valid
      if (!isValidDiagonal(prev, next, polygon)) return false;

      // Check if any other vertex lies inside this potential ear
      for (const p of polygon) {
        if (p === prev || p === curr || p === next) continue;
        
        if (pointInTriangle(p, prev, curr, next)) {
          return false;
        }
      }
      return true;
    };

    const pointInTriangle = (pt: Point, v1: Point, v2: Point, v3: Point): boolean => {
      const sign = (p1: Point, p2: Point, p3: Point): number => {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
      };

      const d1 = sign(pt, v1, v2);
      const d2 = sign(pt, v2, v3);
      const d3 = sign(pt, v3, v1);

      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0); // here
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

      return !(hasNeg && hasPos);
    };

    const triangles: Triangle[] = [];
    const polygonCopy = [...polygon];

    // Ensure we have enough points
    if (polygonCopy.length < 3) return triangles;

    while (polygonCopy.length > 3) {
      let earFound = false;
      
      for (let i = 0; i < polygonCopy.length; i++) {
        if (isEar(polygonCopy, i)) {
          const n = polygonCopy.length;
          const prev = polygonCopy[(i - 1 + n) % n];
          const curr = polygonCopy[i];
          const next = polygonCopy[(i + 1) % n];
          
          triangles.push({ vertices: [prev, curr, next] });
          polygonCopy.splice(i, 1);
          earFound = true;
          break;
        }
      }
      
      if (!earFound) break;  // Prevent infinite loop
    }

    // Add the final triangle
    if (polygonCopy.length === 3) {
      triangles.push({ vertices: [...polygonCopy] });
    }

    return triangles;
  };

  const generateTriangles = useCallback(() => {
    if (points.length < 3) {
      alert('Please add at least three points to generate triangles.');
      return;
    }
    const result = earClipTriangulation(points);
    setTriangles(result);
  }, [points]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setPoints([...points, newPoint]);
  };

  const handleClear = () => {
    setPoints([]);
    setTriangles([]);
  };

  return (
    <NotebookPage
      title="Triangulation"
      description="Learn about triangulation, its implementation, and try an interactive demo."
    >
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b mb-6">
          <button
            className={`px-4 py-2 ${
              activeTab === 'concept' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('concept')}
          >
            Concept
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'implementation' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('implementation')}
          >
            Implementation
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'interactive' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('interactive')}
          >
            Interactive Demo
          </button>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Concept Tab */}
          {activeTab === 'concept' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-3">Polygon Triangulation</h3>
                
                {/* Introduction */}
                <div className="mb-6">
                  <p className="mb-4 text-gray-700">
                    Polygon triangulation is a fundamental problem in computational geometry that involves dividing a polygon into a set 
                    of non-overlapping triangles. Think of it as breaking down a complex shape into the simplest possible geometric 
                    forms - triangles. Every polygon with three or more vertices can be triangulated.
                  </p>
                  
                  {/* Basic visualization */}
                  <svg viewBox="0 0 400 200" className="w-full h-48 mb-4 bg-white">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="400" height="200" fill="url(#grid)" />
                    
                    {/* Original polygon */}
                    <path d="M100,50 L300,50 L250,150 L150,150 Z" 
                          fill="rgba(59, 130, 246, 0.1)" 
                          stroke="#3B82F6" 
                          strokeWidth="2"/>
                    
                    {/* Triangulation lines */}
                    <path d="M100,50 L250,150" 
                          stroke="#3B82F6" 
                          strokeWidth="1" 
                          strokeDasharray="4"/>
                    
                    {/* Vertices */}
                    <circle cx="100" cy="50" r="3" fill="#2563EB"/>
                    <circle cx="300" cy="50" r="3" fill="#2563EB"/>
                    <circle cx="250" cy="150" r="3" fill="#2563EB"/>
                    <circle cx="150" cy="150" r="3" fill="#2563EB"/>
                  </svg>
                </div>

                {/* Mathematical Foundation */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Mathematical Properties and Theorems</h4>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <h5 className="font-medium text-black">The Fundamental Triangle Numbers:</h5>
                      <p>For any simple polygon with n vertices:</p>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Any triangulation will have exactly (n-2) triangles</li>
                        <li>Any triangulation will use exactly (n-3) diagonals</li>
                        <li>These numbers are invariant - they're the same regardless of how you triangulate the polygon</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-black">Two-Ears Theorem:</h5>
                      <p className="mb-2">Every simple polygon with more than three vertices has at least two "ears" - vertices that can be cut off to form a triangle without intersecting the polygon.</p>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="italic">This theorem is the foundation of the "ear clipping" algorithm, one of the most intuitive approaches to triangulation.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ear Clipping Algorithm */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">The Ear Clipping Algorithm</h4>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      The ear clipping algorithm, also known as ear trimming, works by repeatedly "cutting off" ears of the polygon 
                      until only a triangle remains. An ear is formed by three consecutive vertices where the triangle they form 
                      contains no other vertices of the polygon.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h6 className="font-medium mb-2">Step 1: Find an Ear</h6>
                        <svg viewBox="0 0 100 100" className="w-full">
                          <path d="M20,20 L80,20 L80,80 L20,80 Z" 
                                fill="none" 
                                stroke="#3B82F6" 
                                strokeWidth="2"/>
                          <path d="M20,20 L80,20 L80,80" 
                                fill="rgba(59, 130, 246, 0.2)" 
                                stroke="#3B82F6" 
                                strokeWidth="1"
                                strokeDasharray="4"/>
                        </svg>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h6 className="font-medium mb-2">Step 2: Remove Ear</h6>
                        <svg viewBox="0 0 100 100" className="w-full">
                          <path d="M20,20 L80,80 L20,80 Z" 
                                fill="none" 
                                stroke="#3B82F6" 
                                strokeWidth="2"/>
                        </svg>
                      </div>
                      
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h6 className="font-medium mb-2">Step 3: Repeat</h6>
                        <svg viewBox="0 0 100 100" className="w-full">
                          <path d="M20,20 L80,80 L20,80 Z" 
                                fill="rgba(59, 130, 246, 0.2)" 
                                stroke="#3B82F6" 
                                strokeWidth="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Concepts and Tests */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-4">Essential Tests and Checks</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-2">1. Valid Diagonal Test</h5>
                      <p className="text-gray-700 mb-2">
                        A diagonal is valid if it lies entirely inside the polygon and doesn't intersect any other edges. 
                        This requires two key checks:
                      </p>
                      <ul className="list-disc pl-5 text-gray-700">
                        <li>Interior check: The diagonal must lie inside the polygon</li>
                        <li>Intersection check: The diagonal must not intersect any non-adjacent edges</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">2. Ear Identification</h5>
                      <p className="text-gray-700 mb-2">
                        For a vertex to form an ear, it must satisfy:
                      </p>
                      <ul className="list-disc pl-5 text-gray-700">
                        <li>The diagonal between its neighbors must be valid</li>
                        <li>No other vertex of the polygon can lie inside the triangle formed by the vertex and its neighbors</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">3. Point-in-Triangle Test</h5>
                      <p className="text-gray-700">
                        This test uses barycentric coordinates or the sign of cross products to determine if a point lies 
                        inside a triangle. You need this to check if a potential ear is valid!
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Implementation Tab */}
          {activeTab === 'implementation' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Python Implementation</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{codeExample}</code>
              </pre>
            </div>
          )}

          {/* Interactive Demo Tab */}
          {activeTab === 'interactive' && (
            <div>
            <p className="text-gray-700 mb-4">Note: You must place points in clockwise order for the triangulation to work.</p>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={generateTriangles}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                  Generate Triangles
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Clear
                </button>
              </div>
              <div
                className="relative w-full h-96 bg-gray-50 border border-gray-200 rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Draw polygon edges */}
                  {points.length > 0 && (
                    <path
                      d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
                      fill="none"
                      stroke="blue"
                      strokeWidth="2"
                    />
                  )}

                  {/* Render triangulation */}
                  {triangles.map((triangle, index) => (
                    <polygon
                      key={index}
                      points={triangle.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                      fill="rgba(0, 0, 255, 0.1)"
                      stroke="blue"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Render vertices */}
                  {points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r={4}
                      fill="red"
                    />
                  ))}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default Triangulation;

// add back clockwise function