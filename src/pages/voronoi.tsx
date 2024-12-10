import React, { useState, useMemo, useRef } from 'react';
import * as d3 from 'd3-delaunay';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

const codeExample = `class VoronoiDiagram:
    """Implementation of Fortune's sweepline algorithm for Voronoi diagram construction.
    
    Fortune's algorithm is an optimal O(n log n) algorithm that constructs a Voronoi
    diagram by sweeping a line from top to bottom across the plane. It maintains a
    beach line of parabolas and handles two types of events:
    - Site events: when the sweep line hits a new site
    - Circle events: when three consecutive arcs on the beach line converge
    
    The algorithm's efficiency comes from its clever handling of these events using
    a priority queue, avoiding the need to compute all possible circle events upfront.
    """
    
    def __init__(self, points: List[Point]):
        """Initialize the Voronoi diagram with input sites.
        
        Args:
            points: List of Point objects representing sites
            
        Raises:
            ValueError: If fewer than 2 points provided
        """
        if len(points) < 2:
            raise ValueError("Need at least 2 points for Voronoi diagram")
        self.points = points
        self.edges = []  # Final Voronoi edges
        self.events = []  # Priority queue for events
        self.beach_line = None  # Binary tree for beach line
        self.cell_records = {}  # Maps sites to their Voronoi cells
        
    def handle_site_event(self, site: Point) -> None:
        """Process a site event when sweep line encounters a new site.
        
        When the sweep line hits a new site:
        1. Find the arc above the site in the beach line
        2. Replace that arc with three new arcs
        3. Create new circle events if applicable
        
        Args:
            site: Point object representing the new site
        """
        if not self.beach_line:
            self.beach_line = Arc(site)
            return
            
        # Find arc above site
        arc = self.find_arc_above(site)
        
        # Replace arc with new arcs
        left_arc = Arc(arc.site)
        middle_arc = Arc(site)
        right_arc = Arc(arc.site)
        
        # Update beach line connections
        middle_arc.prev = left_arc
        middle_arc.next = right_arc
        left_arc.next = middle_arc
        right_arc.prev = middle_arc
        
        # Create new edges
        edge = Edge(arc.site, site)
        self.edges.append(edge)
        
        # Check for new circle events
        self.check_circle_event(left_arc)
        self.check_circle_event(right_arc)

    def handle_circle_event(self, arc: 'Arc') -> None:
        """Process a circle event when three arcs converge.
        
        When three consecutive arcs form a circle event:
        1. Create a Voronoi vertex at the circle center
        2. Remove the middle arc from the beach line
        3. Add the new Voronoi edges
        4. Check for new circle events
        
        Args:
            arc: Middle arc of the three converging arcs
        """
        # Create Voronoi vertex at circle center
        center = self.compute_circle_center(arc.prev.site, arc.site, arc.next.site)
        
        # Create new Voronoi edges
        edge1 = Edge(arc.prev.site, arc.site, start=center)
        edge2 = Edge(arc.site, arc.next.site, start=center)
        self.edges.extend([edge1, edge2])
        
        # Remove middle arc
        arc.prev.next = arc.next
        arc.next.prev = arc.prev
        
        # Check for new circle events
        self.check_circle_event(arc.prev)
        self.check_circle_event(arc.next)

    def compute_circle_center(self, p1: Point, p2: Point, p3: Point) -> Point:
        """Calculate center of circle passing through three points.
        
        Uses the perpendicular bisector method:
        1. Construct perpendicular bisectors of two sides
        2. Find their intersection point
        
        Args:
            p1, p2, p3: Three points defining the circle
            
        Returns:
            Point representing circle center
            
        Raises:
            ValueError: If points are collinear
        """
        # Check for collinearity
        d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y))
        if abs(d) < 1e-10:
            raise ValueError("Points are collinear")
            
        # Compute circle center using perpendicular bisector method
        ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + 
              (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) +
              (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d
              
        uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) +
              (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) +
              (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d
              
        return Point(ux, uy)

    def check_circle_event(self, arc: 'Arc') -> None:
        """Check if three consecutive arcs form a circle event.
        
        A circle event occurs when three consecutive arcs on the beach line
        converge to a point. This happens when:
        1. The circumcenter of the three sites lies below all three arcs
        2. The circle through the three sites has no other sites inside
        
        Args:
            arc: Middle arc of three consecutive arcs to check
        """
        if not (arc.prev and arc.next):
            return
            
        try:
            center = self.compute_circle_center(arc.prev.site, arc.site, arc.next.site)
            radius = np.sqrt((center.x - arc.site.x)**2 + (center.y - arc.site.y)**2)
            
            # Check if circle event is valid
            if self.is_valid_circle_event(center, radius, arc):
                event = CircleEvent(center.y + radius, arc, center)
                heapq.heappush(self.events, event)
                arc.circle_event = event
        except ValueError:
            pass  # Collinear points - no circle event

    def construct_diagram(self) -> List[Edge]:
        """Construct the Voronoi diagram using Fortune's algorithm.
        
        Algorithm steps:
        1. Initialize empty beach line and event queue
        2. Add all site events to queue
        3. Process events in order:
           - Site events: Update beach line and check for circle events
           - Circle events: Create Voronoi vertex and update beach line
        4. Clean up any infinite edges
        
        Returns:
            List of Edge objects forming the Voronoi diagram
        """
        # Initialize event queue with site events
        for point in self.points:
            heapq.heappush(self.events, SiteEvent(point.y, point))
            
        # Process events in order
        while self.events:
            event = heapq.heappop(self.events)
            
            if isinstance(event, SiteEvent):
                self.handle_site_event(event.site)
            else:  # Circle event
                if event.is_valid:  # Check if still valid
                    self.handle_circle_event(event.arc)
                    
        # Clean up infinite edges
        self.clip_infinite_edges()
        return self.edges

    def clip_infinite_edges(self) -> None:
        """Clip infinite Voronoi edges to a bounding box.
        
        Voronoi edges extending to infinity are clipped to a bounding box
        that contains all sites plus some margin. This ensures the diagram
        is practical for visualization and computational purposes.
        """
        margin = 10  # Add margin to bounding box
        
        # Compute bounding box
        min_x = min(p.x for p in self.points) - margin
        max_x = max(p.x for p in self.points) + margin
        min_y = min(p.y for p in self.points) - margin
        max_y = max(p.y for p in self.points) + margin
        
        # Clip each edge
        for edge in self.edges:
            if edge.is_infinite():
                self.clip_edge_to_box(edge, min_x, max_x, min_y, max_y)

    def compute_cell_areas(self) -> Dict[Point, float]:
        """Compute areas of all Voronoi cells.
        
        The area of a Voronoi cell represents the region of points closer
        to its site than to any other site. These areas can be used for:
        - Natural neighbor interpolation
        - Weighted centroid calculations
        - Density estimation
        
        Returns:
            Dictionary mapping sites to their cell areas
        """
        areas = {}
        for site in self.points:
            cell_edges = self.get_cell_edges(site)
            if cell_edges:
                areas[site] = self.compute_polygon_area(cell_edges)
        return areas

    @staticmethod
    def compute_polygon_area(vertices: List[Point]) -> float:
        """Compute area of polygon using shoelace formula.
        
        Also known as the surveyor's formula, this method computes the area
        of a polygon given its vertices in order:
        Area = 1/2 * |∑(x_i * y_{i+1} - x_{i+1} * y_i)|
        
        Args:
            vertices: List of polygon vertices in order
            
        Returns:
            Area of polygon
        """
        n = len(vertices)
        if n < 3:
            return 0.0
            
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += vertices[i].x * vertices[j].y
            area -= vertices[j].x * vertices[i].y
        return abs(area) / 2`;

const VoronoiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('concept');
  const [points, setPoints] = useState<Point[]>([]);
  const [showPoints, setShowPoints] = useState(true);
  const [showVoronoi, setShowVoronoi] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [bounds] = useState({ width: 800, height: 400 });

  // Add a new point on canvas click with proper SVG coordinate mapping
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const point = svg.createSVGPoint();

// Use raw click coordinates directly
point.x = e.clientX;
point.y = e.clientY;

// Transform to SVG coordinates
const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());


    // Constrain the point within bounds
    const newPoint: Point = {
      x: Math.max(0, Math.min(svgPoint.x, bounds.width)),
      y: Math.max(0, Math.min(svgPoint.y, bounds.height))
    };

    setPoints((prevPoints) => [...prevPoints, newPoint]);
  };

  const handleClear = () => setPoints([]);

  const voronoiDiagram = useMemo(() => {
    if (points.length < 2) return null;
    const delaunay = d3.Delaunay.from(points.map((p) => [p.x, p.y]));
    return delaunay.voronoi([0, 0, bounds.width, bounds.height]);
  }, [points, bounds]);

  const renderVoronoiDiagram = () => {
    if (!voronoiDiagram || !showVoronoi) return null;

    return (
      <g>
        {points.map((_, i) => {
          const path = voronoiDiagram.renderCell(i);
          if (!path) return null;
          return (
            <path
              key={i}
              d={path}
              fill="rgba(0, 100, 255, 0.1)"
              stroke="rgba(0, 100, 255, 0.5)"
              strokeWidth="1"
            />
          );
        })}
      </g>
    );
  };

  return (
    <NotebookPage
      title="Voronoi Diagram"
      description="Explore and visualize Voronoi diagrams interactively."
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
    <section>
      <h3 className="text-xl font-semibold mb-3">What is a Voronoi Diagram?</h3>
      
      {/* Introduction */}
      <div className="mb-6">
        <p className="mb-4 text-gray-700">
          Named after Georgy Voronoi, a Voronoi diagram is a partitioning of a plane into regions based on the principle of proximity. Given a set of points called sites, each region consists of all points closer to its site than to any other site. Fun fact: this mathematical structure appears naturally in phenomena ranging from crystal formation to animal territories.
        </p>
        
        {/* Basic visualization */}
        <svg viewBox="0 0 400 200" className="w-full h-48 mb-4 bg-white">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="200" fill="url(#grid)" />
          
          {(() => {
            // Example points for the visualization
            const examplePoints: Point[] = [
              { x: 100, y: 100 },
              { x: 300, y: 100 },
              { x: 200, y: 50 },
              { x: 150, y: 150 },
              { x: 250, y: 150 }
            ];
            
            // Create Voronoi diagram
            const delaunay = d3.Delaunay.from(examplePoints.map(p => [p.x, p.y]));
            const voronoi = delaunay.voronoi([0, 0, 400, 200]);
            
            return (
              <>
                {/* Render Voronoi cells */}
                {examplePoints.map((_, i) => (
                  <path
                    key={i}
                    d={voronoi.renderCell(i)}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#3B82F6"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Render sites (points) */}
                {examplePoints.map((point, i) => (
                  <circle
                    key={`point-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#2563EB"
                  />
                ))}
              </>
            );
          })()}
        </svg>
      </div>

      {/* Mathematical Foundation */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-4">Mathematical Definition</h4>
        <div className="space-y-4 text-gray-700">
          <div>
            <h5 className="font-medium text-black">Formal Definition:</h5>
            <p className="mb-2">For a set of points P = {'{p₁, ..., pₙ}'} in a plane, the Voronoi cell of point pᵢ is defined as:</p>
            <div className="bg-blue-50 p-3 rounded">
              <p className="italic">
                V(pᵢ) = {'{x : d(x, pᵢ) ≤ d(x, pⱼ) for all j ≠ i}'}
              </p>
              <p className="mt-2 text-sm">
                where d(x,p) represents the Euclidean distance between points x and p
              </p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-black">Key Properties:</h5>
            <ul className="list-disc pl-5 mt-2">
              <li>Voronoi edges are equidistant from their generating sites</li>
              <li>Voronoi vertices are equidistant from three or more sites</li>
              <li>Each cell is a convex polygon (possibly unbounded)</li>
              <li>The dual graph of a Voronoi diagram is the Delaunay triangulation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Geometric Construction */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-4">Geometric Construction</h4>
        <div className="space-y-4">
          <p className="text-gray-700">
            The boundary between two Voronoi cells is formed by the perpendicular bisector of the line segment connecting their sites. Each Voronoi vertex is the center of a circle that passes through three or more sites and contains no other sites in its interior.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <h6 className="font-medium mb-2">Edge Construction</h6>
              <p className="text-gray-700">A Voronoi edge is a segment of the perpendicular bisector between two sites, trimmed by the bisectors of adjacent site pairs.</p>
            </div>
            
            <div className="bg-white p-3 rounded shadow-sm">
              <h6 className="font-medium mb-2">Vertex Formation</h6>
              <p className="text-gray-700">A Voronoi vertex is formed where three or more perpendicular bisectors intersect, marking the center of a circle through those sites.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Computational Aspects */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-4">Computational Complexity</h4>
        <div className="space-y-4 text-gray-700">
          <div>
            <h5 className="font-medium text-black">Theoretical Bounds:</h5>
            <ul className="list-disc pl-5 mt-2">
              <li>Optimal algorithms run in O(n log n) time</li>
              <li>Space complexity is O(n)</li>
              <li>Output size is O(n) for n input points</li>
              <li>Lower bound is Ω(n log n) in the algebraic decision tree model</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded mt-4">
            <p className="italic">
              Fortune&apos;s sweep line algorithm achieves the optimal O(n log n) time complexity by cleverly using a beach line structure to process sites in order of their y-coordinates.
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
      <h3 className="text-xl font-semibold mb-3">How It's Implemented</h3>
      <p className="text-gray-700 mb-4">
        This implementation uses Fortune's sweepline algorithm, which constructs the Voronoi diagram in O(n log n) time by sweeping a line across the plane and maintaining a beach line of parabolas.
      </p>
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
                    checked={showVoronoi}
                    onChange={(e) => setShowVoronoi(e.target.checked)}
                  />
                  <span>Show Voronoi</span>
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
                  {renderVoronoiDiagram()}
                  {showPoints &&
                    points.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="rgba(0, 100, 255, 0.8)"
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

export default VoronoiPage;