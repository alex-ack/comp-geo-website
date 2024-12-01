import React, { useState, useCallback } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

interface Measurements {
  distances: number[];
  area: number | null;
}

const GeometricPrimitives: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [points, setPoints] = useState<Point[]>([]);
  const [showLines, setShowLines] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [mode, setMode] = useState<'draw' | 'move'>('draw');
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>({
    distances: [],
    area: null
  });

  

  const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const calculatePolygonArea = (vertices: Point[]): number => {
    if (vertices.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
  };

  const updateMeasurements = useCallback((newPoints: Point[]) => {
    const distances: number[] = [];
    for (let i = 1; i < newPoints.length; i++) {
      distances.push(calculateDistance(newPoints[i-1], newPoints[i]));
    }
    const area = newPoints.length >= 3 ? calculatePolygonArea(newPoints) : null;
    setMeasurements({ distances, area });
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'draw') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    updateMeasurements(newPoints);
  };

  const handlePointMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'move') {
      setActivePoint(index);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activePoint === null || mode !== 'move') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const newPoints = [...points];
    newPoints[activePoint] = newPoint;
    setPoints(newPoints);
    updateMeasurements(newPoints);
  };

  const handleCanvasMouseUp = () => {
    setActivePoint(null);
  };

  const handleClear = () => {
    setPoints([]);
    setMeasurements({ distances: [], area: null });
  };

  // SVG path for connecting points
  const createLinePath = (): string => {
    if (points.length < 2) return '';
    return points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
  };

  // SVG polygon points string
  const createPolygonPoints = (): string => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  return (
    <NotebookPage
      title="Geometric Primitives"
      description="Learn about fundamental geometric objects like points, lines, and polygons."
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
          {/* Concept Tab */}
          {activeTab === 'concept' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-3">Points: The Building Blocks</h3>
                <p className="mb-4 text-gray-700">
                  A point represents a location in 2D space through its (x, y) coordinates. 
                  Understanding points is essential because they form the foundation for all 
                  geometric computations.
                </p>

                {/* Point Visualization */}
                <div className="mb-4">
                  <svg className="w-full h-48 bg-gray-50 rounded-lg">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                             refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563"/>
                      </marker>
                    </defs>
                    <g transform="translate(50,20)">
                      {/* Coordinate system */}
                      <line x1="0" y1="100" x2="200" y2="100" 
                            stroke="#94A3B8" strokeWidth="1" 
                            markerEnd="url(#arrowhead)"/>
                      <line x1="20" y1="180" x2="20" y2="20" 
                            stroke="#94A3B8" strokeWidth="1" 
                            markerEnd="url(#arrowhead)"/>
                      <text x="190" y="95" className="text-sm">x</text>
                      <text x="25" y="30" className="text-sm">y</text>
                      
                      {/* Distance demonstration */}
                      <circle cx="80" cy="60" r="4" fill="#2563EB"/>
                      <circle cx="140" cy="120" r="4" fill="#2563EB"/>
                      <line x1="80" y1="60" x2="140" y2="60" 
                            stroke="#DC2626" strokeWidth="1" strokeDasharray="4"/>
                      <line x1="140" y1="60" x2="140" y2="120" 
                            stroke="#DC2626" strokeWidth="1" strokeDasharray="4"/>
                      <line x1="80" y1="60" x2="140" y2="120" 
                            stroke="#2563EB" strokeWidth="2"/>
                      <text x="70" y="55" className="text-sm">P₁</text>
                      <text x="145" y="125" className="text-sm">P₂</text>
                    </g>
                  </svg>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Operations:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>
                      Distance calculation between two points:
                      d = √[(x₂ - x₁)² + (y₂ - y₁)²]
                    </li>
                    <li>
                      Finding midpoints and interpolation between points
                    </li>
                    <li>
                      Point comparison and sorting in geometric algorithms
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">Lines: Connections in Space</h3>
                <p className="mb-4 text-gray-700">
                  A line segment connects two points and carries properties like length, slope, 
                  and direction. Lines are fundamental to shape construction and geometric analysis.
                </p>

                {/* Line Visualization */}
                <div className="mb-4">
                  <svg className="w-full h-48 bg-gray-50 rounded-lg">
                    <g transform="translate(50,20)">
                      {/* Line with slope components */}
                      <line x1="40" y1="120" x2="160" y2="40" 
                            stroke="#2563EB" strokeWidth="2"/>
                      <line x1="40" y1="120" x2="160" y2="120" 
                            stroke="#DC2626" strokeWidth="1" strokeDasharray="4"/>
                      <line x1="160" y1="40" x2="160" y2="120" 
                            stroke="#DC2626" strokeWidth="1" strokeDasharray="4"/>
                      <text x="90" y="135" className="text-sm">Δx</text>
                      <text x="165" y="85" className="text-sm">Δy</text>
                      <text x="85" y="70" className="text-sm">slope = Δy/Δx</text>
                    </g>
                  </svg>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Properties:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>
                      Length calculation using the distance formula
                    </li>
                    <li>
                      Slope determination: m = (y₂ - y₁)/(x₂ - x₁)
                    </li>
                    <li>
                      Line intersection and parallel/perpendicular testing
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">Polygons: Enclosed Shapes</h3>
                <p className="mb-4 text-gray-700">
                  Polygons are closed shapes formed by connecting multiple points. They're essential 
                  in computer graphics and computational geometry algorithms.
                </p>

                {/* Polygon Visualization */}
                <div className="mb-4">
                  <svg className="w-full h-48 bg-gray-50 rounded-lg">
                    <g transform="translate(50,20)">
                      {/* Example polygon */}
                      <path d="M 40,40 L 160,40 L 180,100 L 100,140 L 20,100 Z" 
                            fill="#93C5FD" fillOpacity="0.3" 
                            stroke="#2563EB" strokeWidth="2"/>
                      {/* Vertices */}
                      <circle cx="40" cy="40" r="4" fill="#2563EB"/>
                      <circle cx="160" cy="40" r="4" fill="#2563EB"/>
                      <circle cx="180" cy="100" r="4" fill="#2563EB"/>
                      <circle cx="100" cy="140" r="4" fill="#2563EB"/>
                      <circle cx="20" cy="100" r="4" fill="#2563EB"/>
                    </g>
                  </svg>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Calculations:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>
                      Perimeter: Sum of all edge lengths
                    </li>
                    <li>
                      Area using the Shoelace formula for any simple polygon
                    </li>
                    <li>
                      Point-in-polygon testing using ray casting algorithm
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {/* Implementation Tab */}
          {activeTab === 'implementation' && (
  <div className="space-y-8">
    <section>
      <h3 className="text-xl font-semibold mb-3">Point Implementation</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <code>{`class Point:
    """A point in 2D space with pure mathematical operations."""
    def __init__(self, x: float, y: float):
        self.x = x  # x-coordinate in Cartesian plane
        self.y = y  # y-coordinate in Cartesian plane
    
    def distance_to(self, other: 'Point') -> float:
        """Calculate Euclidean distance using Pythagorean theorem:
        distance = √[(x₂-x₁)² + (y₂-y₁)²]
        """
        dx = self.x - other.x  # Change in x (run)
        dy = self.y - other.y  # Change in y (rise)
        return math.sqrt(dx * dx + dy * dy)
    
    def midpoint(self, other: 'Point') -> 'Point':
        """Find the point exactly between this point and another.
        midpoint = ((x₁+x₂)/2, (y₁+y₂)/2)
        """
        return Point(
            (self.x + other.x) / 2,  # Average of x coordinates 
            (self.y + other.y) / 2   # Average of y coordinates
        )`}</code>
      </pre>
    </section>

    <section>
      <h3 className="text-xl font-semibold mb-3">Line Implementation</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <code>{`class Line:
    """A line segment defined by two points with pure geometric calculations."""
    def __init__(self, p1: Point, p2: Point):
        self.p1 = p1  # Starting point
        self.p2 = p2  # Ending point
    
    def length(self) -> float:
        """Calculate length using point-to-point distance."""
        return self.p1.distance_to(self.p2)
    
    def slope(self) -> Optional[float]:
        """Calculate slope (rise over run).
        slope = Δy/Δx = (y₂-y₁)/(x₂-x₁)
        Returns None for vertical lines (undefined slope).
        """
        dx = self.p2.x - self.p1.x
        if abs(dx) < 1e-10:  # Vertical line check
            return None
        dy = self.p2.y - self.p1.y
        return dy / dx
    
    def point_at_parameter(self, t: float) -> Point:
        """Get point along line using parametric equations:
        x = x₁ + t(x₂-x₁)
        y = y₁ + t(y₂-y₁)
        where t ∈ [0,1] gives points on the line segment
        """
        return Point(
            self.p1.x + t * (self.p2.x - self.p1.x),
            self.p1.y + t * (self.p2.y - self.p1.y)
        )`}</code>
      </pre>
    </section>

    <section>
      <h3 className="text-xl font-semibold mb-3">Polygon Implementation</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <code>{`class Polygon:
    """A polygon defined by vertices with pure geometric calculations."""
    def __init__(self, vertices: List[Point]):
        if len(vertices) < 3:
            raise ValueError("Polygon must have at least 3 vertices")
        self.vertices = vertices
    
    def area(self) -> float:
        """Calculate area using the Shoelace formula:
        For vertices (x₁,y₁), (x₂,y₂), ..., (xₙ,yₙ):
        Area = ½|∑(x₁y₂ + x₂y₃ + ... + xₙy₁) - (y₁x₂ + y₂x₃ + ... + yₙx₁)|
        
        This works by:
        1. Taking cross products of adjacent vertices
        2. Summing the cross products
        3. Dividing by 2 to get the actual area
        """
        area = 0.0
        n = len(self.vertices)
        for i in range(n):
            j = (i + 1) % n  # Next vertex (wraps around)
            # Add cross product terms
            area += self.vertices[i].x * self.vertices[j].y
            area -= self.vertices[j].x * self.vertices[i].y
        return abs(area) / 2.0
    
    def is_point_inside(self, point: Point) -> bool:
        """Ray casting algorithm for point-in-polygon test:
        1. Cast a ray from the point to the right (increasing x)
        2. Count intersections with polygon edges
        3. If odd number of intersections, point is inside
        
        This works because a ray from an interior point must exit
        the polygon an odd number of times.
        """
        inside = False
        j = len(self.vertices) - 1  # Start with last vertex
        
        for i in range(len(self.vertices)):
            # Check if point's y is between vertices
            if ((self.vertices[i].y > point.y) != 
                (self.vertices[j].y > point.y)):
                # Calculate x-intersection of ray with edge
                # using point-slope form of line equation
                if point.x < (
                    (self.vertices[j].x - self.vertices[i].x) *
                    (point.y - self.vertices[i].y) /
                    (self.vertices[j].y - self.vertices[i].y) +
                    self.vertices[i].x
                ):
                    inside = not inside  # Toggle inside/outside
            j = i  # Move to next edge
            
        return inside`}</code>
      </pre>
    </section>
  </div>
)}

          {/* Interactive Tab */}
          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <div className="flex items-center space-x-4 bg-gray-100 p-2 rounded">
                  <button
                    onClick={() => setMode('draw')}
                    className={`px-3 py-1 rounded ${
                      mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-white'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setMode('move')}
                    className={`px-3 py-1 rounded ${
                      mode === 'move' ? 'bg-blue-500 text-white' : 'bg-white'
                    }`}
                  >
                    Move
                  </button>
                </div>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showLines}
                    onChange={(e) => setShowLines(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Show Lines</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showPolygon}
                    onChange={(e) => setShowPolygon(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Show Polygon</span>
                </label>
              </div>

              <div 
                className="relative w-full h-96 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-crosshair"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Lines */}
                  {showLines && points.length >= 2 && (
                    <path
                      d={createLinePath()}
                      fill="none"
                      stroke="red"
                      strokeWidth="2"
                    />
                  )}
                  
                  {/* Polygon */}
                  {showPolygon && points.length >= 3 && (
                    <polygon
                      points={createPolygonPoints()}
                      fill="rgba(0, 255, 0, 0.2)"
                      stroke="green"
                      strokeWidth="2"
                    />
                  )}
                </svg>

                {/* Points */}
                {points.map((point, index) => (
                  <div
                    key={index}
                    className={`absolute w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 
                      ${mode === 'move' ? 'cursor-move hover:bg-blue-600' : ''}`}
                    style={{
                      left: `${point.x}px`,
                      top: `${point.y}px`
                    }}
                    onMouseDown={(e) => handlePointMouseDown(index, e)}
                  >
                    <div className="absolute top-4 left-4 text-xs bg-white px-1 rounded shadow">
                      P{index + 1}({Math.round(point.x)}, {Math.round(point.y)})
                    </div>
                  </div>
                ))}
              </div>

              {/* Measurements Panel */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">Measurements</h3>
                {points.length >= 2 && showLines && (
                  <div className="mb-2">
                    <p>Distances between points:</p>
                    <ul className="list-disc pl-5">
                      {measurements.distances.map((distance, index) => (
                        <li key={index}>
                          P{index + 1} to P{index + 2}: {distance.toFixed(2)} units
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showPolygon && measurements.area !== null && (
                  <div className="mt-2">
                    <p>Polygon Area: {measurements.area.toFixed(2)} square units</p>
                  </div>
                )}
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

export default GeometricPrimitives;