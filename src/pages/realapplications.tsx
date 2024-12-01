import { useState } from 'react';
import NotebookPage from '../components/NotebookPage';
import { ChevronRight } from 'lucide-react';

const ApplicationsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const applications = [
    {
      title: "Geographic Information Systems (GIS)",
      category: "mapping",
      concepts: ["Delaunay Triangulation", "Line Arrangements", "Point Location"],
      description: "Computational geometry powers modern mapping and GIS systems through terrain modeling, route planning, and spatial analysis.",
      examples: [
        "Digital Elevation Models using triangulated irregular networks (TINs)",
        "Efficient spatial queries for map features",
        "Polygon overlay operations for land use analysis"
      ],
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      )
    },
    {
      title: "Computer Graphics & Gaming",
      category: "graphics",
      concepts: ["Convex Hull", "Collision Detection", "Visibility Graphs"],
      description: "Real-time rendering, physics simulations, and game mechanics rely heavily on computational geometry algorithms.",
      examples: [
        "Physics engine collision detection using convex hulls",
        "Character line-of-sight calculations",
        "Dynamic obstacle avoidance in game AI"
      ],
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8"/>
          <path d="M12 17v4"/>
        </svg>
      )
    },
    {
      title: "Medical Imaging & Biology",
      category: "medical",
      concepts: ["Voronoi Diagrams", "Surface Reconstruction", "Shape Analysis"],
      description: "Advanced medical imaging and biological modeling applications leverage geometric algorithms for analysis and visualization.",
      examples: [
        "3D organ reconstruction from CT/MRI slices",
        "Cell growth modeling using Voronoi diagrams",
        "Protein structure analysis and visualization"
      ],
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 0-3 3v7h6V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 9h2a2 2 0 0 1 0 4h-2"/>
          <path d="M5 9H3a2 2 0 0 0 0 4h2"/>
          <path d="M12 19c-2.8 0-5-2.2-5-5v-3h10v3c0 2.8-2.2 5-5 5Z"/>
        </svg>
      )
    },
    {
      title: "Robotics & Motion Planning",
      category: "robotics",
      concepts: ["Configuration Space", "Visibility Graphs", "Voronoi Diagrams"],
      description: "Autonomous navigation and robotic motion planning rely on geometric algorithms for efficient and safe movement.",
      examples: [
        "Path planning using visibility graphs",
        "Safe distance maintenance with Voronoi diagrams",
        "Robotic arm movement optimization"
      ],
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <circle cx="12" cy="5" r="3"/>
          <path d="M12 8v3"/>
        </svg>
      )
    },
    {
      title: "Computer-Aided Design (CAD)",
      category: "design",
      concepts: ["Boolean Operations", "Surface Reconstruction", "Mesh Generation"],
      description: "CAD systems use computational geometry for modeling, analysis, and manufacturing preparation.",
      examples: [
        "3D model boolean operations",
        "Mesh generation for finite element analysis",
        "Manufacturing toolpath generation"
      ],
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 21h10"/>
          <path d="M12 3v18"/>
          <path d="M3 7h18"/>
          <path d="M3 17h18"/>
        </svg>
      )
    }
  ];

  const categories = [
    { id: 'all', name: 'All Applications' },
    { id: 'mapping', name: 'Mapping & GIS' },
    { id: 'graphics', name: 'Graphics & Gaming' },
    { id: 'medical', name: 'Medical & Biology' },
    { id: 'robotics', name: 'Robotics' },
    { id: 'design', name: 'CAD & Design' }
  ];

  const filteredApplications = activeCategory === 'all' 
    ? applications
    : applications.filter(app => app.category === activeCategory);

  return (
    <NotebookPage
      title="Real-World Applications"
      description="Explore how computational geometry concepts are applied across different industries and domains."
    >
      <div className="w-full space-y-6">
        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {categories.map(category => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApplications.map((app, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-blue-500">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{app.title}</h3>
                    <p className="text-gray-600 mb-4">{app.description}</p>
                    
                    {/* Key Concepts */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Key Concepts Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {app.concepts.map((concept, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Example Applications */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Example Applications:</h4>
                      <ul className="space-y-2">
                        {app.examples.map((example, i) => (
                          <li key={i} className="flex items-start space-x-2 text-gray-600">
                            <ChevronRight className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </NotebookPage>
  );
};

export default ApplicationsPage;