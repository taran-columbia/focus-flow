import React, { useState, useRef } from 'react';

export const useGazeStability = (onZoneOutTrigger) => {
  // A buffer to store the last 30 frames of iris positions (~1-2 seconds of data)
  const positionBuffer = useRef([]);
  const zoneOutTimer = useRef(null);
  const [isZoningOut, setIsZoningOut] = useState(false);

  const checkStability = (currentIrisPos) => {
    // 1. Add new position to buffer
    positionBuffer.current.push(currentIrisPos);
    if (positionBuffer.current.length > 60) positionBuffer.current.shift();

    // 2. Calculate Variance (Movement)
    // We calculate how much the iris has moved from the average position in the buffer
    const avgX = positionBuffer.current.reduce((a, b) => a + b.x, 0) / positionBuffer.current.length;
    const avgY = positionBuffer.current.reduce((a, b) => a + b.y, 0) / positionBuffer.current.length;
    
    const movementScore = positionBuffer.current.reduce((acc, pos) => {
      return acc + Math.sqrt(Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2));
    }, 0) / positionBuffer.current.length;

    // 3. Logic: If movement is below a tiny threshold (0.0005), start the 10s countdown
    const IS_TOO_STILL = movementScore < 0.0008; 

    if (IS_TOO_STILL && !zoneOutTimer.current) {
    //   console.log("User seems static. Starting 10s 'Zone Out' timer...");
      zoneOutTimer.current = setTimeout(() => {
        setIsZoningOut(true);
        onZoneOutTrigger(); // This will eventually show the popup
      }, 10000);
    } else if (!IS_TOO_STILL) {
      // If they move their eyes, reset the timer
      if (zoneOutTimer.current) {
        clearTimeout(zoneOutTimer.current);
        zoneOutTimer.current = null;
        setIsZoningOut(false);
        // console.log("Focus regained - timer reset.");
      }
    }
    
    return movementScore;
  };

  return { checkStability, isZoningOut };
};