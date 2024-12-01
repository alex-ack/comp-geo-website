import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notebooks = [
  {
    filename: 'geometric-primitives',
    title: 'Geometric Primitives',
    description: 'Learn about fundamental geometric objects like points, lines, and polygons.'
  },
  {
    filename: 'convex-hull',
    title: 'Convex Hull',
    description: 'Explore algorithms for finding the convex hull of a set of points.'
  },
  {
    filename: 'line-intersection',
    title: 'Line Intersection',
    description: 'Study algorithms for detecting and computing line segment intersections.'
  },
  {
    filename: 'triangulation',
    title: 'Triangulation',
    description: 'Learn about polygon triangulation algorithms and their applications.'
  },
  {
    filename: 'voronoi',
    title: 'Voronoi Diagrams',
    description: 'Understand Voronoi diagrams and their geometric properties.'
  },
  {
    filename: 'delaunay',
    title: 'Delaunay Triangulation',
    description: 'Explore Delaunay triangulation and its relationship with Voronoi diagrams.'
  },
  {
    filename: 'arrangements',
    title: 'Arrangements',
    description: 'Study arrangements of geometric objects and their applications.'
  },
  {
    filename: 'geodesic',
    title: 'Geodesic',
    description: 'Learn about geodesic distances and paths on surfaces.'
  },
  {
    filename: 'sources',
    title: 'Sources',
    description: 'Here are the resources I referenced. The textbook is really good!'
  },
  {
    filename: 'realapplications',
    title: 'Real Applications',
    description: 'These are some of the most relevant applications of computational geometry.'
  }
];

const pageTemplate = `import React from 'react';
import NotebookPage from '../components/NotebookPage';

const TITLE_PAGE = () => {
  return (
    <NotebookPage
      title="TITLE"
      description="DESCRIPTION"
    >
      {/* Interactive visualization will go here */}
    </NotebookPage>
  );
};

export default TITLE_PAGE;
`;

// Create pages directory if it doesn't exist
const pagesDir = path.join(__dirname, '..', 'src', 'pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

// Generate pages
notebooks.forEach(({ filename, title, description }) => {
  const pageName = title.replace(/\s+/g, '');
  let content = pageTemplate
    .replace(/TITLE_PAGE/g, pageName)
    .replace(/TITLE/g, title)
    .replace(/DESCRIPTION/g, description);

  const filePath = path.join(pagesDir, `${filename}.tsx`);
  fs.writeFileSync(filePath, content);
  console.log(`Generated ${filePath}`);
});

// Generate index file with routes
const routesContent = `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
${notebooks.map(({ filename, title }) => 
  `import ${title.replace(/\s+/g, '')} from './pages/${filename}';`
).join('\n')}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          ${notebooks.map(({ filename, title }) => 
            `<Route path="/${filename}" element={<${title.replace(/\s+/g, '')} />} />`
          ).join('\n          ')}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;`;

const appFilePath = path.join(__dirname, '..', 'src', 'App.tsx');
fs.writeFileSync(appFilePath, routesContent);
console.log('Generated App.tsx with routes');