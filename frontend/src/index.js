import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ReportPage from './ReportPage';
import ErrorBoundary from './ErrorBoundary';

const path = window.location.pathname;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    {path === '/report' ? <ReportPage /> : <App />}
  </ErrorBoundary>
);