import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();

  const animationSettings = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5 },
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div {...animationSettings}>
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/geometric-primitives"
          element={
            <motion.div {...animationSettings}>
              <GeometricPrimitives />
            </motion.div>
          }
        />
        <Route
          path="/convex-hull"
          element={
            <motion.div {...animationSettings}>
              <ConvexHull />
            </motion.div>
          }
        />
        <Route
          path="/line-intersection"
          element={
            <motion.div {...animationSettings}>
              <LineIntersection />
            </motion.div>
          }
        />
        <Route
          path="/triangulation"
          element={
            <motion.div {...animationSettings}>
              <Triangulation />
            </motion.div>
          }
        />
        <Route
          path="/voronoi"
          element={
            <motion.div {...animationSettings}>
              <VoronoiPage />
            </motion.div>
          }
        />
        <Route
          path="/delaunay"
          element={
            <motion.div {...animationSettings}>
              <Delaunay />
            </motion.div>
          }
        />
        <Route
          path="/arrangements"
          element={
            <motion.div {...animationSettings}>
              <Arrangements />
            </motion.div>
          }
        />
        <Route
          path="/geodesic"
          element={
            <motion.div {...animationSettings}>
              <Geodesic />
            </motion.div>
          }
        />
        <Route
          path="/sources"
          element={
            <motion.div {...animationSettings}>
              <Sources />
            </motion.div>
          }
        />
        <Route
          path="/realapplications"
          element={
            <motion.div {...animationSettings}>
              <RealApplications />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;