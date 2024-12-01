import React, { useState, useMemo, useRef } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Line {
  m: number; // slope
  b: number; // y-intercept
  id: number;
}

const codeExample = `from typing import List, Tuple, Optional
import numpy as np

class Line:
    """A line in 2D space represented in slope-intercept form (y = mx + b)."""
    def __init__(self, slope: float, intercept: float):
        self.m = slope
        self.b = intercept
        
    @classmethod
    def from_points(cls, p1: Tuple[float, float], p2: Tuple[float, float]) -> 'Line':
        """Create a line from two points.
        
        Args:
            p1: First point (x1, y1)
            p2: Second point (x2, y2)
            
        Returns:
            Line object
            
        Raises:
            ValueError: If points are identical or create a vertical line
        """
        if p1[0] == p2[0]:
            raise ValueError("Vertical line not supported in slope-intercept form")
        if p1 == p2:
            raise ValueError("Points must be distinct")
            
        slope = (p2[1] - p1[1]) / (p2[0] - p1[0])
        intercept = p1[1] - slope * p1[0]
        return cls(slope, intercept)

class Intersection:
    """Represents an intersection point between two lines."""
    def __init__(self, x: float, y: float, line1: Line, line2: Line):
        self.x = x
        self.y = y
        self.lines = (line1, line2)

class LineArrangement:
    """Manages a collection of lines and their intersections.
    
    Key Operations:
    1. Add/remove lines
    2. Compute all intersections
    3. Determine faces (regions)
    4. Check point location
    """
    def __init__(self):
        self.lines: List[Line] = []
        self.intersections: List[Intersection] = []
        
    def add_line(self, line: Line) -> None:
        """Add a line and update intersections.
        
        Time Complexity: O(n) where n is number of existing lines
        """
        # Compute new intersections with existing lines
        for existing_line in self.lines:
            intersection = self._compute_intersection(line, existing_line)
            if intersection:
                self.intersections.append(intersection)
        self.lines.append(line)
        
    def _compute_intersection(self, line1: Line, line2: Line) -> Optional[Intersection]:
        """Compute intersection point of two lines.
        
        Mathematical derivation:
        Given lines y = m₁x + b₁ and y = m₂x + b₂
        At intersection: m₁x + b₁ = m₂x + b₂
        Therefore: x = (b₂ - b₁)/(m₁ - m₂)
        
        Args:
            line1, line2: Line objects
            
        Returns:
            Intersection object if lines intersect, None if parallel
        """
        # Check for parallel lines
        if abs(line1.m - line2.m) < 1e-10:  # Use epsilon for float comparison
            return None
            
        # Compute intersection point
        x = (line2.b - line1.b) / (line1.m - line2.m)
        y = line1.m * x + line1.b
        return Intersection(x, y, line1, line2)
        
    def get_faces(self) -> List[List[Intersection]]:
        """Compute faces (regions) of the arrangement.
        
        A face is bounded by line segments between intersections.
        This is a complex operation requiring:
        1. Sorting intersections along each line
        2. Connecting adjacent intersections
        3. Identifying closed cycles
        
        Time Complexity: O(n² log n) where n is number of lines
        """
        # Implementation would go here
        # This is a complex operation requiring careful handling
        # of geometric primitives and topological relationships
        pass
        
    def point_location(self, x: float, y: float) -> int:
        """Determine which face contains a given point.
        
        Uses ray shooting algorithm:
        1. Shoot ray horizontally to the right
        2. Count intersections with arrangement lines
        3. Use even-odd rule to determine containment
        
        Args:
            x, y: Coordinates of query point
            
        Returns:
            Index of containing face
        """
        # Implementation would go here
        pass

    @property 
    def combinatorial_complexity(self) -> dict:
        """Compute arrangement complexity metrics.
        
        For n lines in general position:
        - Vertices (intersections): n(n-1)/2
        - Edges (line segments): n(n-1)
        - Faces (regions): n(n-1)/2 + n + 1
        """
        n = len(self.lines)
        return {
            'vertices': n * (n-1) // 2,
            'edges': n * (n-1),
            'faces': n * (n-1) // 2 + n + 1
        }`;

const ArrangementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [lines, setLines] = useState<Line[]>([]);
  const [showIntersections, setShowIntersections] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [bounds] = useState({ width: 800, height: 400 });

  // Calculate intersections between all lines
  const intersections = useMemo(() => {
    const points = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const line1 = lines[i];
        const line2 = lines[j];

        // Skip parallel lines (same slope)
        if (line1.m === line2.m) continue;

        // Calculate intersection point
        const x = (line2.b - line1.b) / (line1.m - line2.m);
        const y = line1.m * x + line1.b;

        // Only add points within bounds
        if (x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }, [lines, bounds]);

  // Add a new random line on canvas click
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();

    // Get click coordinates
    point.x = e.clientX;
    point.y = e.clientY;

    // Transform to SVG coordinates
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    // Create a random line passing near the clicked point
    const slope = Math.random() * 4 - 2; // Random slope between -2 and 2
    const yIntercept = svgPoint.y - slope * svgPoint.x;

    setLines((prevLines) => [
      ...prevLines,
      {
        m: slope,
        b: yIntercept,
        id: Date.now(),
      },
    ]);
  };

  const handleClear = () => setLines([]);

  // Render a line using SVG
  const renderLine = (line: Line) => {
    const x1 = 0;
    const y1 = line.b;
    const x2 = bounds.width;
    const y2 = line.m * bounds.width + line.b;

    return (
      <line
        key={line.id}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(0, 100, 255, 0.5)"
        strokeWidth="2"
      />
    );
  };

  return (
    <NotebookPage
      title="Line Arrangements"
      description="Explore and visualize line arrangements interactively."
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
            {/* Introduction Section */}
            <section>
              <h3 className="text-xl font-semibold mb-3">Understanding Arrangements</h3>
              <div className="mb-6">
                <p className="text-gray-700">
                  In computational geometry, an arrangement is a structural decomposition of space created by geometric objects. 
                  When these objects intersect, they create a partition of the space into distinct regions, each with unique 
                  properties. While arrangements can be created by various geometric objects (curves, circles, planes), 
                  line arrangements are particularly fundamental and illustrate key concepts clearly.
                </p>
              </div>
          
              {/* Visual Examples */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Simple Arrangement</h4>
        <svg viewBox="0 0 200 200" className="w-full h-48 bg-white mb-2">
          <line x1="40" y1="40" x2="160" y2="160" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="40" y1="160" x2="160" y2="40" stroke="#3B82F6" strokeWidth="2"/>
        </svg>
        <p className="text-sm text-gray-600">Two lines create a simple arrangement</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Three Line Arrangement</h4>
        <svg viewBox="0 0 200 200" className="w-full h-48 bg-white mb-2">
          <line x1="40" y1="60" x2="160" y2="80" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="60" y1="160" x2="140" y2="40" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="20" y1="120" x2="180" y2="140" stroke="#3B82F6" strokeWidth="2"/>
        </svg>
        <p className="text-sm text-gray-600">Three lines creating multiple intersections</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Concurrent Lines</h4>
        <svg viewBox="0 0 200 200" className="w-full h-48 bg-white mb-2">
          <line x1="100" y1="40" x2="100" y2="160" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="40" y1="100" x2="160" y2="100" stroke="#3B82F6" strokeWidth="2"/>
          <line x1="40" y1="160" x2="160" y2="40" stroke="#3B82F6" strokeWidth="2"/>
        </svg>
        <p className="text-sm text-gray-600">Three lines meeting at a single point</p>
      </div>
              </div>
          
              {/* Key Components Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-4">Structure of an Arrangement</h4>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h5 className="font-medium text-black">Components:</h5>
                    <ul className="list-disc pl-5 mt-2">
                      <li><strong>Vertices:</strong> Points where lines intersect</li>
                      <li><strong>Edges:</strong> Line segments between intersection points</li>
                      <li><strong>Faces:</strong> Polygonal regions bounded by edges</li>
                    </ul>
                  </div>
                </div>
              </div>
          
              {/* Mathematical Properties */}
              <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-4">Mathematical Properties</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-medium mb-2">General Position</h5>
            <p className="text-gray-700 mb-2">
              A set of lines is said to be in general position when:
            </p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>No two lines are parallel</li>
              <li>No three lines pass through the same point</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium mb-2">Combinatorial Complexity</h5>
            <p className="text-gray-700 mb-2">
              For n lines in general position, the arrangement has:
            </p>
            <ul className="list-disc pl-5 text-gray-700">
              <li>n(n-1)/2 vertices (intersection points)</li>
              <li>n(n-1) edges (line segments)</li>
              <li>n(n-1)/2 + n + 1 faces (regions)</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium mb-2">Duality</h5>
            <p className="text-gray-700">
              A fundamental property of line arrangements is their duality with point configurations: each line can be 
              mapped to a point and vice versa, preserving their structural relationships. This duality principle is 
              crucial for many geometric algorithms.
            </p>
          </div>
        </div>
      </div>
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
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleClear}
                >
                  Clear Lines
                </button>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showIntersections}
                    onChange={(e) => setShowIntersections(e.target.checked)}
                  />
                  <span>Show Intersections</span>
                </label>
              </div>

              <div
                className="relative overflow-hidden bg-gray-50 border-2 border-gray-200 rounded-lg cursor-crosshair"
                style={{ width: `${bounds.width}px`, height: `${bounds.height}px` }}
              >
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                  onClick={handleCanvasClick}
                >
                  {lines.map(renderLine)}
                  {showIntersections &&
                    intersections.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="rgba(255, 0, 0, 0.5)"
                      />
                    ))}
                </svg>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click anywhere to add a random line passing near that point
              </p>
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default ArrangementPage;
