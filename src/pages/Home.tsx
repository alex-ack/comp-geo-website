import { Github } from "lucide-react";

const generateTriangulation = (rowCount: number, colCount: number) => {
  const triangles: JSX.Element[] = [];
  const colors = ["#2563EB", "#475569", "#1D4ED8", "#64748B"];
  const opacityLevels = [0.3, 0.4, 0.5, 0.6];

  // Generate a grid of points
  const points = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      points.push({
        x: col * (100 / colCount) + Math.random() * 5,
        y: row * (100 / rowCount) + Math.random() * 5,
      });
    }
  }

  // Create triangles by connecting neighboring points
  for (let row = 0; row < rowCount - 1; row++) {
    for (let col = 0; col < colCount - 1; col++) {
      const i = row * colCount + col;
      const triangleColor = colors[Math.floor(Math.random() * colors.length)];
      const triangleOpacity =
        opacityLevels[Math.floor(Math.random() * opacityLevels.length)];

      // Define two triangles per grid cell
      const triangle1 = `
        ${points[i].x}%,${points[i].y}% 
        ${points[i + 1].x}%,${points[i + 1].y}% 
        ${points[i + colCount].x}%,${points[i + colCount].y}%
      `;
      const triangle2 = `
        ${points[i + 1].x}%,${points[i + 1].y}% 
        ${points[i + colCount].x}%,${points[i + colCount].y}% 
        ${points[i + colCount + 1].x}%,${points[i + colCount + 1].y}%
      `;

      triangles.push(
        <polygon
          key={`triangle1-${i}`}
          points={triangle1}
          fill={triangleColor}
          opacity={triangleOpacity}
        />
      );
      triangles.push(
        <polygon
          key={`triangle2-${i}`}
          points={triangle2}
          fill={triangleColor}
          opacity={triangleOpacity}
        />
      );
    }
  }

  return triangles;
};

const Home = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-white">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 w-full h-full bg-grid"
        style={{
          backgroundImage:
            "linear-gradient(transparent, transparent 95%, #e2e8f0 95%), linear-gradient(90deg, transparent, transparent 95%, #e2e8f0 95%)",
          backgroundSize: "20px 20px",
          opacity: 0.2,
        }}
      ></div>

      {/* Enhanced SVG background pattern */}
      <svg className="absolute inset-0 w-full h-full">
        {generateTriangulation(10, 10)} {/* Adjust rowCount and colCount for density */}
      </svg>

      {/* Content container */}
      <div className="relative px-8 py-12 rounded-2xl bg-white border border-gray-200 shadow-lg max-w-2xl mx-4 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Computational Geometry Notebooks
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Hey! These are my interactive notebooks for my independent study with
          Norm. Feel free to explore, and if you're confused about
          anything or have suggestions, make a PR on GitHub!
        </p>

        <div className="flex justify-center">
          <a
            href="https://github.com/alex-ack/Computational-Geometry-IS"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;