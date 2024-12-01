import React from 'react';

interface NotebookPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const NotebookPage: React.FC<NotebookPageProps> = ({ title, description, children }) => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="prose lg:prose-xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl mb-8">{description}</p>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8 min-h-[400px] border rounded-lg p-4">{children}</div>
          <div className="mt-8"></div>
        </div>
      </div>
    </div>
  );
};

export default NotebookPage;
