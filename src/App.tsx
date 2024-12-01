import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GeometricPrimitives from './pages/geometric-primitives';
import ConvexHull from './pages/convex-hull';
import LineIntersection from './pages/line-intersection';
import Triangulation from './pages/triangulation';
import VoronoiPage from './pages/voronoi';
import Delaunay from './pages/delaunay';
import Arrangements from './pages/arrangements';
import Geodesic from './pages/geodesic';
import Sources from './pages/sources';
import RealApplications from './pages/realapplications';


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/geometric-primitives" element={<GeometricPrimitives />} />
          <Route path="/convex-hull" element={<ConvexHull />} />
          <Route path="/line-intersection" element={<LineIntersection />} />
          <Route path="/triangulation" element={<Triangulation />} />
          <Route path="/voronoi" element={<VoronoiPage />} /> {/* Updated route */}
          <Route path="/delaunay" element={<Delaunay />} />
          <Route path="/arrangements" element={<Arrangements />} />
          <Route path="/geodesic" element={<Geodesic />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/realapplications" element={<RealApplications />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
