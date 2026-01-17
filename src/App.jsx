import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { analyzeFocus } from './helper';
import { useGazeStability } from './gaze';
import { YouTubePlayer } from './YouTubePlayer';

function App() {
  const videoRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [focusStatus, setFocusStatus] = useState("UNKNOWN");
  const lastStatus = useRef("UNKNOWN");
  const [zoneOutAlerted, setZoneOutAlerted] = useState(false);

  // 1. Initialize MediaPipe Face Landmarker
  useEffect(() => {
    const setupLandmarker = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const instance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        refineLandmarks: true, 
  outputFaceBlendshapes: true
      });
      setLandmarker(instance);
      setIsReady(true);
    };
    setupLandmarker();
  }, []);

  // 2. Setup Camera Stream
  useEffect(() => {
    if (!isReady) return;
    
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
    });
  }, [isReady]);
  
  const { checkStability, isZoningOut } = useGazeStability(() => {
  // alert("Are you still focusing on the video?"); 
  // We will replace this alert with a nice Modal on Day 6
  setZoneOutAlerted(true);
});
  // 3. The Prediction Loop (The "Heart")
  const predictWebcam = () => {
  if (landmarker && videoRef.current) {
    let startTimeMs = performance.now();
    // const results = landmarker.detectForVideo(videoRef.current, startTimeMs);
    
    // if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    //   const { status, ratio } = analyzeFocus(results.faceLandmarks[0]);
      
    //   // Update a piece of state to show on screen
    //   setFocusStatus(status); 
    //   // console.log(`Focus Status: ${status}, Gaze Ratio: ${ratio.toFixed(2)}`);
    //   // Professional Tip: Only log on change to keep console clean
    //   if (status !== lastStatus.current) {
    //     console.log(`User is now: ${status}`);
    //     lastStatus.current = status;
    //   }
    // }

    const results = landmarker.detectForVideo(videoRef.current, startTimeMs);

  if (results.faceLandmarks?.[0] && results.faceBlendshapes?.[0]) {
    const { status } = analyzeFocus(
      results.faceLandmarks[0], 
      results.faceBlendshapes[0].categories // Pass the categories array here
    );
      setFocusStatus(status); 
      // console.log(`Focus Status: ${status}, Gaze Ratio: ${ratio.toFixed(2)}`);
      // Professional Tip: Only log on change to keep console clean
      if (status !== lastStatus.current) {
        // console.log(`User is now: ${status}`);
        lastStatus.current = status;
      }
  }
  if (results.faceLandmarks?.[0]) {
    const landmarks = results.faceLandmarks[0];
    const iris = landmarks[468]; // Use the left iris
    
    // Check stability
    const score = checkStability({ x: iris.x, y: iris.y });
    
    // Log the score so you can calibrate the threshold
    // console.log("Movement Score:", score);
  }
  }
  window.requestAnimationFrame(predictWebcam);
};

  return (
    <div>
      {!isReady && <p>Loading AI Model...</p>}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '400px', border: '2px solid black' }} 
      />
      <YouTubePlayer lostFocus={zoneOutAlerted} />
    </div>
  );
}

export default App;