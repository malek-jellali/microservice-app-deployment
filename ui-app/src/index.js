import React from 'react';
import ReactDOM from 'react-dom';
import './styles/styles.scss';  // Ensure styles are imported
import App from './App';  // Import App component

// Render the App component into the DOM
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')  // This should match the id in your index.html
);
