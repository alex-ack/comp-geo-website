import { useState } from 'react';
import NotebookPage from '../components/NotebookPage';

interface Point {
  x: number;
  y: number;
}

const GeometricPrimitives = () => {
  const [activeTab, setActiveTab] = useState('interactive');
  const [points, setPoints] = useState<Point[]>([]);
  const [showLines, setShowLines] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);

  const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const calculatePolygonArea = (vertices: Point[]): number => {
    if (vertices.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      let j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
  };

  const handlePointClick = (x: number, y: number) => {
    const newPoint = { x, y };
    setPoints([...points, newPoint]);
    
    if (points.length >= 2) {
      // Calculate and display distance between last two points
      const lastPoint = points[points.length - 1];
      const distance = calculateDistance(lastPoint, newPoint);
      console.log(`Distance between last two points: ${distance.toFixed(2)}`);
    }

    if (showPolygon && points.length >= 2) {
      const area = calculatePolygonArea([...points, newPoint]);
      setCalculatedArea(area);
    }
  };

  return (
    <NotebookPage
      title="Geometric Primitives"
      description="Learn about fundamental geometric objects like points, lines, and polygons."
    >
      <div className="space-y-4">
        <div className="flex space-x-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLines}
              onChange={(e) => setShowLines(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>Show Lines</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPolygon}
              onChange={(e) => setShowPolygon(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>Show Polygon</span>
          </label>
        </div>

        <div 
          className="relative w-full h-[500px] bg-gray-50 border border-gray-200 rounded-lg"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            handlePointClick(x, y);
          }}
        >
          {/* Draw Points */}
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ left: point.x, top: point.y }}
            >
              <div className="absolute top-4 left-4 text-xs">
                P{index + 1}({Math.round(point.x)}, {Math.round(point.y)})
              </div>
            </div>
          ))}

          {/* Draw Lines */}
          {showLines && points.length >= 2 && (
            <svg className="absolute inset-0 pointer-events-none">
              {points.map((point, index) => {
                if (index === points.length - 1) return null;
                const nextPoint = points[index + 1];
                return (
                  <line
                    key={index}
                    x1={point.x}
                    y1={point.y}
                    x2={nextPoint.x}
                    y2={nextPoint.y}
                    stroke="red"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          )}

          {/* Draw Polygon */}
          {showPolygon && points.length >= 3 && (
            <svg className="absolute inset-0 pointer-events-none">
              <polygon
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(0, 255, 0, 0.2)"
                stroke="green"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>

        {/* Information Display */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-2">Measurements</h3>
          {points.length >= 2 && showLines && (
            <div className="mb-2">
              <p>
                Last Distance: {calculateDistance(
                  points[points.length - 2],
                  points[points.length - 1]
                ).toFixed(2)} units
              </p>
            </div>
          )}
          {showPolygon && calculatedArea !== null && (
            <div>
              <p>Polygon Area: {calculatedArea.toFixed(2)} square units</p>
            </div>
          )}
        </div>

        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={() => {
            setPoints([]);
            setCalculatedArea(null);
          }}
        >
          Clear Points
        </button>
      </div>
    </NotebookPage>
  );
};

export default GeometricPrimitives;