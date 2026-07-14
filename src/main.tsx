// src/main.tsx
// Requirements: 2.1
import React from 'react';
//import './mockAuth'; // TODO: Xóa dòng này khi backend hoàn thiện
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
