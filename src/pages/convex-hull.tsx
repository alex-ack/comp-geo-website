import React, { useState } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

const ConvexHull: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [points, setPoints] = useState<Point[]>([]);
  const [hull, setHull] = useState<Point[]>([]);

  const codeExample = `class ConvexHull:
    """A class implementing Graham Scan algorithm for computing convex hulls.
    
    The convex hull of a set of points is the smallest convex polygon that
    contains all points in the set. This implementation uses the Graham Scan
    algorithm which runs in O(n log n) time complexity.
    """
    def __init__(self, points: List[Point]):
        """Initialize ConvexHull with a set of 2D points.
        
        Args:
            points: List of Point objects, each with x and y coordinates
        
        Raises:
            ValueError: If fewer than 3 points are provided
        """
        if len(points) < 3:
            raise ValueError("Convex hull requires at least 3 points")
        self.points = points
        self.hull = []

    def cross(self, o: Point, a: Point, b: Point) -> float:
        """Compute the 2D cross product of OA and OB vectors.
        
        This is equivalent to the area of the parallelogram formed by
        vectors OA and OB, and determines the turn direction:
        - Positive: Counter-clockwise turn (left turn)
        - Zero: Collinear points
        - Negative: Clockwise turn (right turn)
        
        Args:
            o: Origin point O
            a: Terminal point A forming vector OA
            b: Terminal point B forming vector OB
        
        Returns:
            float: The signed area of the parallelogram formed by OA and OB
        """
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

    def compute_hull(self) -> List[Point]:
        """Compute the convex hull using the Graham Scan algorithm.
        
        The algorithm works by:
        1. Sorting points lexicographically (by x, then y)
        2. Building lower hull (bottom part) from left to right
        3. Building upper hull (top part) from right to left
        4. Combining lower and upper hulls
        
        This implementation uses the monotone chain variant which is
        more numerically stable than the traditional Graham Scan.
        
        Returns:
            List[Point]: Points forming the convex hull in counter-clockwise order
        """
        # Handle degenerate cases
        if len(self.points) <= 3:
            self.hull = self.points
            return self.hull

        # Sort points lexicographically
        sorted_points = sorted(self.points, key=lambda p: (p.x, p.y))
        
        # Build lower hull
        lower = []
        for p in sorted_points:
            while len(lower) >= 2 and self.cross(lower[-2], lower[-1], p) <= 0:
                lower.pop()
            lower.append(p)
        
        # Build upper hull
        upper = []
        for p in reversed(sorted_points):
            while len(upper) >= 2 and self.cross(upper[-2], upper[-1], p) <= 0:
                upper.pop()
            upper.append(p)
        
        # Combine hulls, removing duplicate points
        # Last point of each list is first point of other list
        self.hull = lower[:-1] + upper[:-1]
        return self.hull

    def get_hull_area(self) -> float:
        """Calculate the area of the convex hull using the Shoelace formula.
        
        The Shoelace formula (also known as surveyor's formula) computes
        the area of a polygon from its vertices:
        Area = ½|∑(x₁y₂ + x₂y₃ + ... + xₙy₁) - (y₁x₂ + y₂x₃ + ... + yₙx₁)|
        
        Returns:
            float: Area of the convex hull
            
        Raises:
            ValueError: If hull hasn't been computed yet
        """
        if not self.hull:
            raise ValueError("Hull must be computed before calculating area")
        
        area = 0.0
        for i in range(len(self.hull)):
            j = (i + 1) % len(self.hull)
            area += self.hull[i].x * self.hull[j].y
            area -= self.hull[j].x * self.hull[i].y
        return abs(area) / 2.0

    def is_point_in_hull(self, point: Point) -> bool:
        """Determine if a point lies within the convex hull.
        
        Uses the fact that for a point inside a convex polygon, it must be
        on the same side of all hull edges when traversing in CCW order.
        
        Args:
            point: Point to test for containment
            
        Returns:
            bool: True if point is inside or on the hull, False otherwise
            
        Raises:
            ValueError: If hull hasn't been computed yet
        """
        if not self.hull:
            raise ValueError("Hull must be computed before testing containment")
            
        # Point is inside if it makes the same turn direction (or none)
        # with respect to all consecutive hull edges
        for i in range(len(self.hull)):
            j = (i + 1) % len(self.hull)
            if self.cross(self.hull[i], self.hull[j], point) < 0:
                return False
        return True`;

  const calculateConvexHull = (inputPoints: Point[]): Point[] => {
    if (inputPoints.length < 3) return inputPoints;

    const sortedPoints = [...inputPoints].sort((a, b) => a.x - b.x || a.y - b.y);

    const cross = (o: Point, a: Point, b: Point): number =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: Point[] = [];
    for (const p of sortedPoints) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: Point[] = [];
    for (const p of sortedPoints.reverse()) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    upper.pop();
    lower.pop();

    return lower.concat(upper);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    setHull(calculateConvexHull(newPoints));
  };

  const handleClear = () => {
    setPoints([]);
    setHull([]);
  };

  const createPolygonPoints = (polygonPoints: Point[]): string => {
    return polygonPoints.map((p) => `${p.x},${p.y}`).join(' ');
  };

  return (
    <NotebookPage
      title="Convex Hull"
      description="Understand and visualize the Convex Hull algorithm step-by-step."
    >
      <div className="w-full">
        {/* Tab Navigation */}
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

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'concept' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-3">Convex Hull</h3>
                
                {/* Introduction */}
                <div className="mb-6">
                  <p className="mb-4 text-gray-700">
                    Imagine wrapping a rubber band around a set of pins stuck in a board - the shape formed by the rubber band 
                    is the convex hull. More formally, the convex hull is the smallest convex polygon that contains all points 
                    in a given set. A polygon is convex if any line segment between two points inside the polygon lies entirely 
                    within the polygon.
                  </p>
                  
                  {/* Basic visualization */}
                  <svg viewBox="0 0 300 200" className="w-full h-48 mb-4 bg-white">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <g className="points">
                      <circle cx="50" cy="150" r="3" fill="#4B5563"/>
                      <circle cx="100" cy="80" r="3" fill="#4B5563"/>
                      <circle cx="150" cy="120" r="3" fill="#4B5563"/>
                      <circle cx="200" cy="60" r="3" fill="#4B5563"/>
                      <circle cx="250" cy="140" r="3" fill="#4B5563"/>
                      <circle cx="180" cy="100" r="3" fill="#4B5563"/>
                      <circle cx="120" cy="130" r="3" fill="#4B5563"/>
                    </g>
                    <path 
                      d="M50,150 L100,80 L200,60 L250,140 L50,150"
                      fill="rgba(37, 99, 235, 0.1)"
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  </svg>
                </div>

                {/* Mathematical Foundation */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Mathematical Foundation: The Cross Product Test</h4>
                  <p className="mb-4 text-gray-700">
                    The core mathematical concept behind finding a convex hull is the cross product test, which determines 
                    whether three points make a left turn, right turn, or form a straight line. For points p, q, and r in 2D space:
                  </p>
                  <div className="bg-gray-100 p-4 rounded mb-4">
                    <code className="text-sm font-mono">
                      def cross_product(p, q, r):<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;return (q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])
                    </code>
                  </div>
                  <p className="mb-2 text-gray-700">The cross product test computes the signed area of the parallelogram formed by vectors pq and pr:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Positive value: Counter-clockwise turn (valid hull edge)</li>
                    <li>Zero: Collinear points</li>
                    <li>Negative value: Clockwise turn (not part of the hull)</li>
                  </ul>
                </div>

                {/* Graham Scan Algorithm */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Graham Scan Algorithm: O(n log n) Implementation</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">1. Anchor Point Selection</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Find the point with the lowest y-coordinate (and leftmost if tied)</li>
                        <li>This point is guaranteed to be on the hull</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">2. Point Sorting</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Sort all other points by polar angle relative to the anchor point</li>
                        <li>When angles are equal, sort by distance from anchor</li>
                        <li>This creates a counter-clockwise ordering around the anchor</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">3. Hull Construction</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Maintain a stack of potential hull points</li>
                        <li>For each point:
                          <ul className="list-disc pl-5 mt-1">
                            <li>While the last three points make a right turn, remove the middle point</li>
                            <li>Add the current point to the stack</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Edge Cases and Time Complexity */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-4">Implementation Details</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-2">Common Pitfalls and Edge Cases:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Collinear Points
                          <ul className="list-disc pl-5 mt-1">
                            <li>Multiple points may have the same polar angle</li>
                            <li>Solution: Sort by distance when angles are equal</li>
                          </ul>
                        </li>
                        <li>Numerical Precision
                          <ul className="list-disc pl-5 mt-1">
                            <li>Floating-point arithmetic can cause issues</li>
                            <li>Consider using integer coordinates or epsilon comparisons</li>
                          </ul>
                        </li>
                        <li>Degenerate Cases
                          <ul className="list-disc pl-5 mt-1">
                            <li>All points collinear</li>
                            <li>Only two distinct points</li>
                            <li>Solution: Handle these cases explicitly</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Time Complexity Analysis:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Sorting points: O(n log n)</li>
                        <li>Graham scan itself: O(n)
                          <ul className="list-disc pl-5 mt-1">
                            <li>Each point is pushed and popped at most once</li>
                            <li>Total operations proportional to input size</li>
                          </ul>
                        </li>
                        <li>Overall complexity is O(n log n), which is optimal for comparison-based algorithms</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'implementation' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-3">Convex Hull Implementation</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <code>{codeExample}</code>
                </pre>
              </section>
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div
                className="relative w-full h-96 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {hull.length > 0 && (
                    <polygon
                      points={createPolygonPoints(hull)}
                      fill="rgba(0, 255, 0, 0.2)"
                      stroke="green"
                      strokeWidth="2"
                    />
                  )}

                  {points.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="blue"
                    />
                  ))}
                </svg>
              </div>

              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleClear}
              >
                Clear Points
              </button>
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default ConvexHull;