export const analyzeFocus = (landmarks, blendshapes) => {
  const leftIris = landmarks[468];
  const eyeTop = landmarks[159]; // Center of upper eyelid
  const eyeBottom = landmarks[145]; // Center of lower eyelid
  
  // 1. Horizontal Ratio (Already working for you)
  const leftInner = landmarks[133];
  const leftOuter = landmarks[33];
  const horizontalRatio = (leftIris.x - leftInner.x) / (leftOuter.x - leftInner.x);

  // 2. Vertical Ratio (New)
  // 0.5 is center. Higher values mean looking down.
  const verticalRatio = (leftIris.y - eyeTop.y) / (eyeBottom.y - eyeTop.y);

  // 3. Blendshape Score (Advanced)
  // This detects the "muscle movement" of looking down
  const lookDownScore = blendshapes.find(b => b.categoryName === "eyeLookDownLeft")?.score || 0;

  let status = "FOCUSED";

  // LOGIC GATE
  if (horizontalRatio < 0.35 || horizontalRatio > 0.65) {
    status = "LOOKING_AWAY_SIDE";
  } else if (verticalRatio > 0.8 || lookDownScore > 0.5) {
    // If the iris is too close to the bottom lid OR the model detects the "look down" shape
    status = "LOOKING_DOWN";
  }

  return { status, horizontalRatio, verticalRatio };
};