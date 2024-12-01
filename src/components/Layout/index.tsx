import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const notebooks = [
    { path: '/geometric-primitives', title: 'Geometric Primitives' },
    { path: '/convex-hull', title: 'Convex Hull' },
    { path: '/line-intersection', title: 'Line Intersection' },
    { path: '/triangulation', title: 'Triangulation' },
    { path: '/voronoi', title: 'Voronoi' },
    { path: '/delaunay', title: 'Delaunay' },
    { path: '/arrangements', title: 'Arrangements' },
    { path: '/geodesic', title: 'Geodesic' },
    { path: '/sources', title: 'Sources' },
    { path: '/realapplications', title: 'Real Applications' }
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden m-0 p-0">
      <nav className="bg-gray-800 text-white p-4 w-full">
        <div className="container mx-auto">
          <Link to="/" className="text-xl font-bold mr-8">
            Computational Geometry
          </Link>
          <div className="mt-4 space-y-2">
            {notebooks.map((notebook) => (
              <Link 
                key={notebook.path}
                to={notebook.path}
                className="block md:inline-block mr-4 hover:text-blue-300 transition-colors"
              >
                {notebook.title}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="w-full m-0 p-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;