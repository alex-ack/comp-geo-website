import React from 'react';
import NotebookPage from '../components/NotebookPage';

const Sources = () => {
  return (
    <NotebookPage
      title="Sources & References"
      description="Academic sources and references for computational geometry implementations."
    >
      <div className="w-full">
        {/* Primary Sources Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Primary Textbook</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-medium">
                de Berg, M., Cheong, O., van Kreveld, M., & Overmars, M. (2008).
              </p>
              <p className="text-gray-700 italic">
                Computational Geometry: Algorithms and Applications
              </p>
              <p className="text-gray-700">
                Third Edition, Springer-Verlag
              </p>
              <div className="mt-3 text-gray-600">
                This comprehensive textbook serves as the primary reference for algorithms and theoretical foundations. 
                Specifically used for:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Line arrangement implementation and analysis</li>
                  <li>Convex hull algorithms and complexity analysis</li>
                  <li>Geometric primitives and robust implementations</li>
                  <li>Theoretical foundations of computational geometry</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Implementation Resources */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Implementation Resources</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Geometric Algorithms</h4>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>CGAL - Computational Geometry Algorithms Library</li>
                    <li>GeometryPrecise - Robust geometric primitives</li>
                    <li>SciPy Spatial algorithms</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Visualization Technologies</h4>
                  <ul className="list-disc pl-6 text-gray-700">
                    <li>React and TypeScript</li>
                    <li>SVG for geometric rendering</li>
                    <li>Tailwind CSS for styling</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Additional References */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Additional References</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4 text-gray-700">
                <p>The implementations also draw from:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Numerical Recipes</strong>
                    <p className="text-gray-600 mt-1">
                      For robust numerical methods and computational considerations
                    </p>
                  </li>
                  <li>
                    <strong>Journal of Computational Geometry</strong>
                    <p className="text-gray-600 mt-1">
                      For current research and modern approaches to classical problems
                    </p>
                  </li>
                  <li>
                    <strong>Handbook of Discrete and Computational Geometry</strong>
                    <p className="text-gray-600 mt-1">
                      For theoretical background and algorithm analysis
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </NotebookPage>
  );
};

export default Sources;