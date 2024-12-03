import React, { useState } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

interface Line {
  start: Point;
  end: Point | null;
}

const LineIntersection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [lines, setLines] = useState<Line[]>([]);
  const [intersections, setIntersections] = useState<Point[]>([]);

  const isPointOnSegment = (point: Point, segmentStart: Point, segmentEnd: Point): boolean => {
    const minX = Math.min(segmentStart.x, segmentEnd.x);
    const maxX = Math.max(segmentStart.x, segmentEnd.x);
    const minY = Math.min(segmentStart.y, segmentEnd.y);
    const maxY = Math.max(segmentStart.y, segmentEnd.y);

    return (
      point.x >= minX &&
      point.x <= maxX &&
      point.y >= minY &&
      point.y <= maxY
    );
  };

  const calculateIntersection = (line1: Line, line2: Line): Point | null => {
    if (!line1.end || !line2.end) return null;

    const { start: p1, end: q1 } = line1;
    const { start: p2, end: q2 } = line2;

    const a1 = q1.y - p1.y;
    const b1 = p1.x - q1.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = q2.y - p2.y;
    const b2 = p2.x - q2.x;
    const c2 = a2 * p2.x + b2 * p2.y;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant === 0) return null; // Lines are parallel or coincident

    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;

    const intersectionPoint = { x, y };

    // Check if the intersection point is within both segments
    if (
      isPointOnSegment(intersectionPoint, p1, q1) &&
      isPointOnSegment(intersectionPoint, p2, q2)
    ) {
      return intersectionPoint;
    }

    return null; // Intersection is outside the line segments
  };

  const calculateIntersections = (lines: Line[]): Point[] => {
    const points: Point[] = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const intersection = calculateIntersection(lines[i], lines[j]);
        if (intersection) points.push(intersection);
      }
    }
    return points;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (lines.length === 0 || lines[lines.length - 1].end) {
      // Start a new line
      setLines([...lines, { start: newPoint, end: null }]);
    } else {
      // Complete the current line
      const updatedLines = [...lines];
      updatedLines[updatedLines.length - 1].end = newPoint;
      setLines(updatedLines);

      // Recalculate intersections for all line pairs
      const newIntersections = calculateIntersections(updatedLines);
      setIntersections(newIntersections);
    }
  };

  const handleClear = () => {
    setLines([]);
    setIntersections([]);
  };

  const codeExample = `class Point:
    """A 2D point with x and y coordinates."""
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

class LineIntersection:
    """
    Line intersection detection using explicit geometric calculations.
    All mathematical operations are shown step-by-step without helper functions.
    """
    def __init__(self, p1: Point, q1: Point, p2: Point, q2: Point):
        # First line segment points
        self.p1 = p1  # Start point of first segment
        self.q1 = q1  # End point of first segment
        # Second line segment points
        self.p2 = p2  # Start point of second segment
        self.q2 = q2  # End point of second segment

    def orientation(self, p: Point, q: Point, r: Point) -> float:
        """
        Determine the orientation of triplet (p, q, r) using vector cross product.

        Mathematical Derivation:
        1. Vector PQ = (q.x - p.x, q.y - p.y)
        2. Vector PR = (r.x - p.x, r.y - p.y)
        3. 2D cross product = PQ.x * PR.y - PQ.y * PR.x
                           = (q.x - p.x)(r.y - p.y) - (q.y - p.y)(r.x - p.x)

        This cross product represents twice the signed area of triangle PQR:
        - Positive: Counter-clockwise orientation (R is left of PQ)
        - Zero: Collinear orientation
        - Negative: Clockwise orientation (R is right of PQ)
        """
        # Calculate vectors and cross product explicitly
        pq_x = q.x - p.x  # x component of vector PQ
        pq_y = q.y - p.y  # y component of vector PQ
        pr_x = r.x - p.x  # x component of vector PR
        pr_y = r.y - p.y  # y component of vector PR
        
        # Compute the cross product
        cross_product = pq_x * pr_y - pq_y * pr_x
        
        # Return orientation value
        if abs(cross_product) < 1e-10:  # Using epsilon for floating-point comparison
            return 0  # Collinear points
        return 1 if cross_product > 0 else -1  # 1 for CCW, -1 for CW

    def get_intersection_point(self) -> Optional[Point]:
        """
        Calculate the exact intersection point of the line segments using
        parametric form and Cramer's Rule.

        Mathematical Derivation:
        1. Parametric form of first line segment: P1 + t(Q1-P1), 0 ≤ t ≤ 1
        2. Parametric form of second line segment: P2 + s(Q2-P2), 0 ≤ s ≤ 1
        3. At intersection: P1 + t(Q1-P1) = P2 + s(Q2-P2)
        4. Cross multiply to solve for t:
           t = det([P2-P1, Q2-P2]) / det([Q1-P1, Q2-P2])
        """
        # Calculate direction vectors
        dx1 = self.q1.x - self.p1.x  # Q1-P1 x component
        dy1 = self.q1.y - self.p1.y  # Q1-P1 y component
        dx2 = self.q2.x - self.p2.x  # Q2-P2 x component
        dy2 = self.q2.y - self.p2.y  # Q2-P2 y component
        
        # Calculate determinant of direction vectors
        det = dx1 * dy2 - dy1 * dx2
        
        if abs(det) < 1e-10:  # Lines are parallel
            return None
            
        # Calculate vector between starting points
        dp_x = self.p2.x - self.p1.x  # P2-P1 x component
        dp_y = self.p2.y - self.p1.y  # P2-P1 y component
        
        # Calculate intersection parameters
        t = (dp_x * dy2 - dp_y * dx2) / det
        s = (dp_x * dy1 - dp_y * dx1) / det
        
        # Check if intersection occurs within both segments
        if 0 <= t <= 1 and 0 <= s <= 1:
            # Calculate intersection point
            x = self.p1.x + t * dx1
            y = self.p1.y + t * dy1
            return Point(x, y)
            
        return None

    def do_intersect(self) -> bool:
        """
        Determine if line segments intersect using relative orientations.
        
        Two segments intersect if and only if:
        1. The triangle p1q1p2 and triangle p1q1q2 have different orientations
        2. The triangle p2q2p1 and triangle p2q2q1 have different orientations

        This is equivalent to points p2 and q2 being on opposite sides of line p1q1,
        AND points p1 and q1 being on opposite sides of line p2q2.
        """
        # Get all four orientations needed for general and special cases
        o1 = self.orientation(self.p1, self.q1, self.p2)
        o2 = self.orientation(self.p1, self.q1, self.q2)
        o3 = self.orientation(self.p2, self.q2, self.p1)
        o4 = self.orientation(self.p2, self.q2, self.q1)

        # General case: segments intersect if orientations differ
        if o1 != o2 and o3 != o4:
            return True

        # Handle special case of collinear segments
        if o1 == 0 and o2 == 0:
            # Check if bounding boxes overlap
            if (max(min(self.p1.x, self.q1.x), min(self.p2.x, self.q2.x)) <=
                min(max(self.p1.x, self.q1.x), max(self.p2.x, self.q2.x)) and
                max(min(self.p1.y, self.q1.y), min(self.p2.y, self.q2.y)) <=
                min(max(self.p1.y, self.q1.y), max(self.p2.y, self.q2.y))):
                return True

        return False`;

  return (
    <NotebookPage
      title="Line Intersection"
      description="Learn how to compute intersections of multiple lines dynamically."
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
  <div className="space-y-8">
    {/* Introduction */}
    <section>
      <h3 className="text-xl font-semibold mb-3">Line Intersection: Where Mathematics Meets Computer Graphics</h3>
      <p className="text-gray-700 mb-4">
        Imagine you're designing a collision detection system for a video game, creating a CAD program for architects, 
        or analyzing traffic patterns on a map. In each case, you need to answer a seemingly simple question: 
        do two line segments intersect? While our intuition can quickly spot intersections by eye, teaching a computer 
        to do this reliably requires some clever mathematics.
      </p>

      {/* Basic Visualization */}
      <div className="w-full h-64 bg-gray-50 border border-gray-200 rounded-lg mb-6">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Example Lines */}
          <line x1="50" y1="150" x2="300" y2="50" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="50" y1="50" x2="300" y2="150" stroke="#3B82F6" strokeWidth="2"/>
          
          {/* Intersection Point */}
          <circle cx="175" cy="100" r="4" fill="#EF4444"/>
          
          {/* Vector Annotations */}
          <path d="M 170,95 L 180,95 L 175,90 Z" fill="#10B981"/> {/* Direction indicator */}
          <path d="M 170,105 L 180,105 L 175,110 Z" fill="#10B981"/> {/* Direction indicator */}
          
          {/* Labels */}
          <text x="40" y="45" className="text-sm" fill="#374151">A</text>
          <text x="305" y="155" className="text-sm" fill="#374151">B</text>
          <text x="40" y="155" className="text-sm" fill="#374151">C</text>
          <text x="305" y="45" className="text-sm" fill="#374151">D</text>
          <text x="185" y="100" className="text-sm" fill="#EF4444">Intersection</text>
        </svg>
      </div>
    </section>

    {/* Mathematical Foundation */}
    <section className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-3">The Mathematical Foundation</h4>
      <div className="space-y-4">
        <div>
          <h5 className="font-medium mb-2">Vector Cross Products in 2D</h5>
          <p className="text-gray-700">
            At the heart of line intersection detection lies the 2D cross product.
            For two vectors a = (ax, ay) and b = (bx, by), the 2D cross product is:
          </p>
          <div className="bg-white p-3 rounded mt-2 font-mono text-sm">
            a × b = ax * by - ay * bx
          </div>
        </div>
        <div>
          <p className="text-gray-700">The result tells us about the relative orientation of the vectors:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Positive result: Vector b is counterclockwise from vector a</li>
            <li>Zero result: Vectors are collinear (parallel)</li>
            <li>Negative result: Vector b is clockwise from vector a</li>
          </ul>
        </div>
      </div>
    </section>

    {/* The Algorithm */}
    <section className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-3">The Algorithm: Putting It All Together</h4>
      <div className="space-y-4">
        <div>
          <h5 className="font-medium mb-2">Check Relative Orientations</h5>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Compute orientation(A, B, C) and orientation(A, B, D)</li>
            <li>If they have different signs, segment CD crosses line AB</li>
            <li>Compute orientation(C, D, A) and orientation(C, D, B)</li>
            <li>If they have different signs, segment AB crosses line CD</li>
            <li>If both conditions are true, we have an intersection!</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Edge Cases */}
    <section className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-3">Edge Cases and Numerical Stability</h4>
      <div className="space-y-4">
        <div>
          <h5 className="font-medium mb-2">Key Considerations</h5>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Numerical Precision
              <ul className="list-disc pl-5 mt-1">
                <li>Using epsilon values for floating-point comparisons</li>
                <li>Handling nearly parallel lines</li>
              </ul>
            </li>
            <li>Degenerate Cases
              <ul className="list-disc pl-5 mt-1">
                <li>Zero-length segments</li>
                <li>Segments sharing an endpoint</li>
                <li>Overlapping collinear segments</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* Performance */}
    <section className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-3">Time Complexity and Performance</h4>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        <li>Single intersection test: O(1)</li>
        <li>Testing n segments against each other: O(n²)</li>
        <li>Optimizations available:
          <ul className="list-disc pl-5 mt-1">
            <li>Sweep line algorithms: O(n log n)</li>
            <li>Spatial partitioning: Average case better than O(n²)</li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
)}

          {activeTab === 'implementation' && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Python Code Example</h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <code>{codeExample.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
              </pre>
            </div>
          )}

          {activeTab === 'interactive' && (
            <div>
              <p className="mb-4 text-gray-700">
                Click on the canvas to set points. Each line requires two points (start and end). Intersections will be calculated for all line pairs dynamically.
              </p>
              <div
                className="relative w-full h-96 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
              >
                <svg className="absolute inset-0 w-full h-full">
                  {lines.map((line, index) => (
                    <React.Fragment key={index}>
                      <line
                        x1={line.start.x}
                        y1={line.start.y}
                        x2={line.end ? line.end.x : line.start.x}
                        y2={line.end ? line.end.y : line.start.y}
                        stroke="blue"
                        strokeWidth="2"
                      />
                      <circle
                        cx={line.start.x}
                        cy={line.start.y}
                        r="5"
                        fill="blue"
                      />
                      {line.end && (
                        <circle
                          cx={line.end.x}
                          cy={line.end.y}
                          r="5"
                          fill="blue"
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {intersections.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="7"
                      fill="red"
                    />
                  ))}
                </svg>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
              {intersections.length > 0 && (
                <div className="mt-4">
                  <p className="text-green-600">Intersections:</p>
                  <ul className="list-disc pl-5">
                    {intersections.map((point, index) => (
                      <li key={index}>
                        ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lines.length > 1 && intersections.length === 0 && (
                <p className="mt-4 text-red-600">No intersections found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default LineIntersection;
