import React from 'react';
import { useNavigate } from 'react-router';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-9xl font-bold text-red-500">404</h1>
          <h2 className="text-4xl font-bold mt-4">Page Not Found</h2>
          <p className="py-6 text-gray-600">
            Sorry, the page you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Back Home
          </button>
        </div>
      </div>
    </div>
  );
};
