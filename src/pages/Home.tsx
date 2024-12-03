import React, { useEffect, useState } from 'react';
import { Github } from "lucide-react";
import { Delaunay } from "d3-delaunay";

// Define the type of a point
type Point = [number, number];

const generateRandomPoints = (count: number, width: number, height: number): Point[] => {
  return Array.from({ length: count }, () => [
    Math.random() * width,
    Math.random() * height,
  ]);
};

const Home: React.FC = () => {
  const [voronoiPaths, setVoronoiPaths] = useState<string[]>([]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const points: Point[] = generateRandomPoints(50, width, height);

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    const paths = Array.from({ length: points.length }, (_, i) => voronoi.renderCell(i));
    setVoronoiPaths(paths);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 text-white flex items-center justify-center overflow-hidden">
      {/* Voronoi Diagram */}
      <svg className="absolute inset-0 w-full h-full">
        {voronoiPaths.map((path, index) => (
          <path
            key={index}
            d={path}
            fill={`rgba(70, 130, 180, ${Math.random() * 0.6 + 0.4})`}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Content */}
      <div className="relative z-10 p-8 bg-white/10 backdrop-blur-md rounded-lg shadow-lg text-center max-w-lg">
        <h1 className="text-4xl font-bold mb-4">Allie's Computational Geometry Independent Study</h1>
        <p className="text-lg mb-6">
        Hey! These are my interactive notebooks for my independent study with
              Norm. Explore! And if you're confused about
              anything or have suggestions, make a PR on GitHub.
        </p>
        <a
          href="https://github.com/alex-ack/Computational-Geometry-IS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium bg-[#212936] hover:bg-[#212936] transition rounded-full shadow-md"
        >
          <Github className="w-6 h-6" />
          View on GitHub
        </a>
      </div>
    </div>
  );
};

export default Home;
