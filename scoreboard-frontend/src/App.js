import React from 'react';
import AppRoutes from './routes';
import { ScoreboardProvider } from './context/ScoreboardContext';
import './App.css';

function App() {
  return (
    <ScoreboardProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </ScoreboardProvider>
  );
}

export default App;