import React, { useState, useMemo, useRef } from 'react';
import * as d3 from 'd3-delaunay';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

const codeExample = `class DelaunayTriangulator:
    """Implementation of Delaunay triangulation using the Bowyer-Watson algorithm.
    
    The Delaunay triangulation of a point set is a triangulation such that no point
    lies inside the circumcircle of any triangle. This property maximizes the minimum
    angle of all triangles, avoiding skinny triangles that could cause numerical
    problems in applications.
    """
    def __init__(self, points: List[Point]):
        """Initialize triangulator with input points.
        
        Args:
            points: List of Point objects with x, y coordinates
            
        Raises:
            ValueError: If fewer than 3 points provided
        """
        if len(points) < 3:
            raise ValueError("Need at least 3 points for triangulation")
        self.points = points
        self.triangles = []
        
    def in_circle(self, p: Point, q: Point, r: Point, s: Point, epsilon: float = 1e-10) -> float:
        """Test if point s lies inside the circumcircle of triangle pqr.
        
        Uses the following determinant calculation:
        | px py px²+py² 1 |
        | qx qy qx²+qy² 1 |
        | rx ry rx²+ry² 1 |
        | sx sy sx²+sy² 1 |
        
        Returns:
        - Positive: s inside circle
        - Negative: s outside circle
        - Zero: s on circle (within epsilon)
        """
        matrix = [
            [p.x, p.y, p.x**2 + p.y**2, 1],
            [q.x, q.y, q.x**2 + q.y**2, 1],
            [r.x, r.y, r.x**2 + r.y**2, 1],
            [s.x, s.y, s.x**2 + s.y**2, 1]
        ]
        result = np.linalg.det(matrix)
        return 0.0 if abs(result) < epsilon else result

    def compute_super_triangle(self) -> Triangle:
        """Create initial triangle containing all points.
        
        Creates a triangle large enough to contain all input points with some
        margin. This super-triangle is removed after triangulation is complete.
        """
        # Find bounding box
        min_x = min(p.x for p in self.points)
        max_x = max(p.x for p in self.points)
        min_y = min(p.y for p in self.points)
        max_y = max(p.y for p in self.points)
        
        # Compute center and size
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        width = max_x - min_x
        height = max_y - min_y
        size = max(width, height) * 2  # Double size for safety
        
        # Create equilateral triangle centered on bounding box
        r = size / np.sqrt(3)
        return Triangle(
            Point(center_x - size, center_y - r),
            Point(center_x + size, center_y - r),
            Point(center_x, center_y + 2 * r)
        )

    def find_bad_triangles(self, point: Point) -> List[Triangle]:
        """Find all triangles whose circumcircle contains point.
        
        These triangles violate the Delaunay condition when point is added
        and must be removed, creating a polygonal hole that will be retriangulated.
        """
        bad_triangles = []
        for triangle in self.triangles:
            if self.in_circle(*triangle.vertices, point) > 0:
                bad_triangles.append(triangle)
        return bad_triangles

    def get_boundary_edges(self, bad_triangles: List[Triangle]) -> List[Edge]:
        """Extract boundary edges of the hole created by removing triangles.
        
        An edge is on the boundary if it appears exactly once among the bad
        triangles - edges that appear twice are internal to the hole.
        """
        # Count edge occurrences
        edge_count = {}
        for triangle in bad_triangles:
            for edge in triangle.edges:
                edge_count[edge] = edge_count.get(edge, 0) + 1
                
        # Return edges that appear once
        return [edge for edge, count in edge_count.items() if count == 1]

    def triangulate(self) -> List[Triangle]:
        """Compute Delaunay triangulation using Bowyer-Watson algorithm.
        
        Algorithm steps:
        1. Start with super-triangle containing all points
        2. Add points one at a time:
           - Find triangles whose circumcircle contains point
           - Remove these triangles to create polygonal hole
           - Retriangulate hole by connecting point to boundary edges
        3. Remove triangles sharing vertices with super-triangle
        
        Returns:
            List of triangles forming the Delaunay triangulation
        """
        # Start with super-triangle
        super_triangle = self.compute_super_triangle()
        self.triangles = [super_triangle]
        
        # Add points incrementally
        for point in self.points:
            # Find triangles whose circumcircle contains point
            bad_triangles = self.find_bad_triangles(point)
            
            # Get boundary of hole
            boundary = self.get_boundary_edges(bad_triangles)
            
            # Remove bad triangles
            for triangle in bad_triangles:
                self.triangles.remove(triangle)
            
            # Re-triangulate hole
            for edge in boundary:
                new_triangle = Triangle(edge.p1, edge.p2, point)
                self.triangles.append(new_triangle)
        
        # Remove triangles using super-triangle vertices
        super_vertices = set(super_triangle.vertices)
        final_triangles = [t for t in self.triangles 
                         if not any(v in super_vertices for v in t.vertices)]
                         
        return final_triangles

    def get_voronoi_diagram(self) -> List[Edge]:
        """Compute Voronoi diagram from Delaunay triangulation.
        
        The Voronoi diagram is the dual graph of the Delaunay triangulation:
        - Voronoi vertices are circumcenters of Delaunay triangles
        - Voronoi edges connect circumcenters of adjacent triangles
        
        Returns:
            List of edges forming the Voronoi diagram
        """
        voronoi_edges = []
        processed = set()
        
        for t1 in self.triangles:
            c1 = t1.circumcenter()
            for t2 in self.triangles:
                if t1 == t2 or (t1, t2) in processed:
                    continue
                    
                # Check if triangles share an edge
                if len(set(t1.vertices) & set(t2.vertices)) == 2:
                    c2 = t2.circumcenter()
                    voronoi_edges.append(Edge(c1, c2))
                    processed.add((t1, t2))
                    processed.add((t2, t1))
                    
        return voronoi_edges`;

const DelaunayTriangulation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [points, setPoints] = useState<Point[]>([]);
  const [showPoints, setShowPoints] = useState(true);
  const [showTriangulation, setShowTriangulation] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [bounds] = useState({ width: 800, height: 400 });

  // Handle canvas click to add new points
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect(); // Obtain the bounding rectangle
const point = svg.createSVGPoint();

// Use rect properties directly in calculations
point.x = e.clientX;
point.y = e.clientY;

// Transform to SVG coordinates
const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

// Example: Leverage rect details if needed
console.log(`Rect details - Left: ${rect.left}, Top: ${rect.top}`);

const newPoint: Point = {
    x: Math.max(0, Math.min(svgPoint.x, bounds.width)),
    y: Math.max(0, Math.min(svgPoint.y, bounds.height)),
};


    setPoints((prevPoints) => [...prevPoints, newPoint]);
  };

  const handleClear = () => setPoints([]);

  // Compute Delaunay triangulation
  const delaunay = useMemo(() => {
    if (points.length < 3) return null;
    return d3.Delaunay.from(points.map((p) => [p.x, p.y]));
  }, [points]);

  // Render triangulation
  const renderTriangulation = () => {
    if (!delaunay || !showTriangulation) return null;

    const triangles: Array<[number, number, number]> = [];
    for (let i = 0; i < delaunay.triangles.length; i += 3) {
      triangles.push([
        delaunay.triangles[i],
        delaunay.triangles[i + 1],
        delaunay.triangles[i + 2]
      ]);
    }

    return (
      <g>
        {triangles.map((triangle, i) => {
          const p1 = points[triangle[0]];
          const p2 = points[triangle[1]];
          const p3 = points[triangle[2]];

          return (
            <path
              key={i}
              d={`M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} Z`}
              fill="rgba(255, 100, 0, 0.1)"
              stroke="rgba(255, 100, 0, 0.5)"
              strokeWidth="1"
            />
          );
        })}
      </g>
    );
  };

  return (
    <NotebookPage
      title="Delaunay Triangulation"
      description="Explore and visualize Delaunay triangulation interactively."
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
            <section>
              <h3 className="text-xl font-semibold mb-3">What is Delaunay Triangulation?</h3>
              
              {/* Introduction */}
              <div className="mb-6">
                <p className="mb-4 text-gray-700">
                There's another page on the general methods of triangulation, but Delaunay triangulation is special enough to warrant its own discussion. Delaunay triangulation, named after Boris Delaunay, is a fundamental geometric structure that creates a triangulation of points with a novel property: it maximizes the minimum angle of all triangles. This property ensures the triangles are as "well-shaped" as possible, avoiding skinny triangles that could cause numerical problems in computational applications.
                </p>
                
                {/* Basic visualization */}
                <svg viewBox="0 0 400 200" className="w-full h-48 mb-4 bg-white">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#grid)" />
                  
                  {/* Example triangulation with proper circumcircle */}
                  <path d="M150,150 L250,150 L200,50 Z" 
                        fill="rgba(59, 130, 246, 0.1)" 
                        stroke="#3B82F6" 
                        strokeWidth="2"/>
                  
                  {/* Circumcircle - centered at (200,116.67) with radius 66.67 */}
                  <circle cx="200" cy="116.67" r="66.67" 
                          fill="none" 
                          stroke="#3B82F6" 
                          strokeWidth="1" 
                          strokeDasharray="4"/>
                  
                  {/* Points */}
                  <circle cx="150" cy="150" r="3" fill="#2563EB"/>
                  <circle cx="250" cy="150" r="3" fill="#2563EB"/>
                  <circle cx="200" cy="50" r="3" fill="#2563EB"/>
                </svg>
              </div>
          
              {/* Mathematical Foundation */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-4">The Empty Circle Property</h4>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h5 className="font-medium text-black">Definition:</h5>
                    <p className="mb-2">A triangulation of a point set is a Delaunay triangulation if and only if the circumcircle of every triangle contains no other points in its interior.</p>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="italic">This empty circle property is what gives Delaunay triangulations their unique characteristics and makes them particularly useful in computational geometry.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-black">Key Properties:</h5>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Maximizes the minimum angle across all possible triangulations</li>
                      <li>Unique for point sets where no four points are cocircular</li>
                      <li>Contains the nearest neighbor graph as a subgraph</li>
                    </ul>
                  </div>
                </div>
              </div>
          
              {/* Relationship with Voronoi */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-4">Duality with Voronoi Diagrams</h4>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    One of the most fascinating aspects of Delaunay triangulation is its relationship with Voronoi diagrams. These structures are duals of each other, meaning:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h6 className="font-medium mb-2">Delaunay → Voronoi</h6>
                      <p className="text-gray-700">Connect the centers of circumcircles of adjacent Delaunay triangles to obtain Voronoi edges.</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h6 className="font-medium mb-2">Voronoi → Delaunay</h6>
                      <p className="text-gray-700">Connect points whose Voronoi cells share an edge to obtain Delaunay edges.</p>
                    </div>
                  </div>
                </div>
              </div>
          
              {/* Computational Aspects */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-4">Algorithmic Complexity</h4>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h5 className="font-medium text-black">Time Complexity:</h5>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Optimal algorithms run in O(n log n) time</li>
                      <li>Space complexity is O(n)</li>
                      <li>Can be constructed incrementally or using divide-and-conquer</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="italic">
                      The incremental algorithm's simplicity makes it popular in practice, despite not having optimal worst-case complexity.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          )}

{activeTab === 'implementation' && (
  <div className="space-y-8">
    <section>
      <h3 className="text-xl font-semibold mb-3">Implementation Details</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <code>{codeExample}</code>
      </pre>
    </section>
  </div>
)}

          {activeTab === 'interactive' && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={handleClear}
                >
                  Clear Points
                </button>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={(e) => setShowPoints(e.target.checked)}
                  />
                  <span>Show Points</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTriangulation}
                    onChange={(e) => setShowTriangulation(e.target.checked)}
                  />
                  <span>Show Triangulation</span>
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
                  {renderTriangulation()}
                  {showPoints &&
                    points.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="rgba(255, 100, 0, 0.8)"
                      />
                    ))}
                </svg>
              </div>
              {points.length < 3 && (
                <p className="text-sm text-gray-600">
                  Add at least 3 points to see the triangulation.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </NotebookPage>
  );
};

export default DelaunayTriangulation;