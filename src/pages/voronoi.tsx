import React, { useState, useMemo, useRef } from 'react';
import * as d3 from 'd3-delaunay';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

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
          
          {/* Example Voronoi cells */}
          <path d="M100,100 L200,50 L250,150 L150,180 Z" 
                fill="rgba(59, 130, 246, 0.1)" 
                stroke="#3B82F6" 
                strokeWidth="2"/>
          <path d="M200,50 L300,80 L250,150 Z" 
                fill="rgba(59, 130, 246, 0.1)" 
                stroke="#3B82F6" 
                strokeWidth="2"/>
          
          {/* Sites */}
          <circle cx="180" cy="100" r="3" fill="#2563EB"/>
          <circle cx="240" cy="90" r="3" fill="#2563EB"/>
          <circle cx="150" cy="130" r="3" fill="#2563EB"/>
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
            <div>
              <h3 className="text-xl font-semibold mb-3">How It’s Implemented</h3>
              <p className="text-gray-700">
                This demo uses <strong>d3-delaunay</strong> to compute the Voronoi diagram
                efficiently. Each cell is dynamically recalculated when points are added or moved.
              </p>
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