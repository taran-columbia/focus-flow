import React, { useState } from 'react';

export const CalibrationUI = ({ onComplete, landmarks }) => {
  const [step, setStep] = useState(0); // 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
  const [points, setPoints] = useState([]);

  const cornerStyles = [
    { top: '0.5%', left: '0.5%' },   // Top-Left
    { top: '0.5%', right: '0.5%' },  // Top-Right
    { bottom: '0.5%', left: '0.5%' },// Bottom-Left
    { bottom: '0.5%', right: '0.5%' }// Bottom-Right
  ];

  const handleCapture = () => {
    if (!landmarks) return;

    // Use refined landmarks for iris (468) and eye corners (133, 33)
    const iris = landmarks[468];
    const inner = landmarks[133];
    const outer = landmarks[33];
    const top = landmarks[159];
    const bottom = landmarks[145];

    // Calculate the Relative Ratio
    const currentRatio = {
      x: (iris.x - inner.x) / (outer.x - inner.x),
      y: (iris.y - top.y) / (bottom.y - top.y)
    };

    const updatedPoints = [...points, currentRatio];

    if (step < 3) {
      setPoints(updatedPoints);
      setStep(step + 1);
    } else {
      // Calculate boundaries based on the 4 corners
      const finalBounds = {
        minX: Math.min(...updatedPoints.map(p => p.x)) - 0.02, // 2% padding
        maxX: Math.max(...updatedPoints.map(p => p.x)) + 0.02,
        minY: Math.min(...updatedPoints.map(p => p.y)) - 0.02,
        maxY: Math.max(...updatedPoints.map(p => p.y)) + 0.02
      };
      onComplete(finalBounds);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999 }}>
      <div 
        onClick={handleCapture}
        style={{
          position: 'absolute',
          ...cornerStyles[step],
          width: '40px',
          height: '40px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          cursor: 'pointer',
          border: '4px solid white',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
        }}
      />
      <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Calibration Phase</h2>
        <p style={{ color: '#94a3b8' }}>Look directly at the red dot and click it.</p>
        <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>Step {step + 1} of 4</p>
      </div>
    </div>
  );
};