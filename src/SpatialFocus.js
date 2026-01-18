// SpatialFocus.js
import React, { useState, useRef } from 'react';

export const useSpatialFocus = (onPauseTrigger) => {
  const [bounds, setBounds] = useState(null); // minX, maxX, minY, maxY
  const distractionTimer = useRef(null);

  const getEyeRatio = (landmarks) => {
    // MediaPipe Refined Landmarks: Iris Center (468), Inner (133), Outer (33), Top (159), Bottom (145)
    const iris = landmarks[468];
    const inner = landmarks[133];
    const outer = landmarks[33];
    const top = landmarks[159];
    const bottom = landmarks[145];

    return {
      x: (iris.x - inner.x) / (outer.x - inner.x),
      y: (iris.y - top.y) / (bottom.y - top.y),
      eyeOpenness: Math.abs(top.y - bottom.y)
    };
  };

  const processFocus = (landmarks) => {
    if (!landmarks || !bounds) return "WAITING_FOR_CALIBRATION";
 
    const currentRatio = getEyeRatio(landmarks);
    const isEyeClosed = currentRatio.eyeOpenness < 0.005; // Adjusted threshold
    
    // Check if iris ratio is within the 4-corner calibrated "Box"
    const isLookingAtScreen = 
      currentRatio.x >= bounds.minX && currentRatio.x <= bounds.maxX &&
      currentRatio.y >= bounds.minY && currentRatio.y <= bounds.maxY;

    if (isEyeClosed || !isLookingAtScreen) {
      if (!distractionTimer.current) {
        distractionTimer.current = setTimeout(() => {
          onPauseTrigger(); // Triggers the programmatic pause
          distractionTimer.current = null;
        }, 5000); // 5-second constant requirement
      }
      return isEyeClosed ? "EYES CLOSED" : "OUT OF FOCUS";
    } else {
      // If user looks back before 5 seconds, reset the timer
      if (distractionTimer.current) {
        clearTimeout(distractionTimer.current);
        distractionTimer.current = null;
      }
      return "FOCUSED";
    }
  };

  return { processFocus, setBounds, isCalibrated: bounds !== null};
};