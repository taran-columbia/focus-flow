import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useGazeStability } from './GazeStability.js';
import { YouTubePlayer } from './YouTubePlayer.jsx';
import { CalibrationUI } from './CalibrationUI.jsx';
import { useSpatialFocus } from './SpatialFocus';

function App() {
  // Refs for hardware and player control
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isPausedRef = useRef(true);
  const lastStatus = useRef("UNKNOWN");

  // State Management
  const [landmarker, setLandmarker] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const [focusStatus, setFocusStatus] = useState("CALIBRATING");
  const [zoneOutAlerted, setZoneOutAlerted] = useState(false);



  // Spatial Focus Hook: Handles 3-second distraction pause
  const { processFocus, setBounds, isCalibrated } = useSpatialFocus(() => {
    ytPlayerRef.current?.pause(); // AI Command: Pause YouTube
  });

  // Gaze Stability Hook: Handles the "Zoning Out" detection
  const { checkStability, isZoningOut } = useGazeStability(() => {
    setZoneOutAlerted(true); // Signal to show the "Are you still there?" modal
  });
  const handlePlayerStateChange = (paused) => {
    isPausedRef.current = paused;
    if (paused) {
      setZoneOutAlerted(false);
      setFocusStatus("VIDEO PAUSED");
    }
  };
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

  const triggerAIPause = () => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.pause(); // Calls pauseVideo() inside the YouTubePlayer component
    }
  };
  useEffect(() => {
    if (!isReady && isCalibrated) return;

    if (isCalibrated) { setFocusStatus("WAITING FOR VIDEO TO PLAY"); }

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
    });
  }, [isReady, isCalibrated]);

  const predictWebcam = () => {
    if (landmarker && videoRef.current) {
      // DEFENSIVE CHECK: Ensure video is actually playing and has dimensions
      if (
        videoRef.current.readyState < 2 || // HAVE_CURRENT_DATA
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
        // (isPausedRef.current && isCalibrated)
      ) {
        window.requestAnimationFrame(predictWebcam);
        return;
      }

      const startTimeMs = performance.now();
      try {
        const results = landmarker.detectForVideo(videoRef.current, startTimeMs);

        if (results.faceLandmarks?.[0]) {
          const landmarks = results.faceLandmarks[0];
          setCurrentLandmarks(landmarks);

          // A. Process Spatial Focus (Out of Bounds Check)
          if (!isPausedRef.current) {
            if (isCalibrated) {
              const status = processFocus(landmarks);
              setFocusStatus(status);

              if (status !== lastStatus.current) {
                console.log(`Focus State: ${status}`);
                lastStatus.current = status;
              }
            }

            // B. Process Gaze Stability (Zoning Out Check)
            checkStability({ x: landmarks[468].x, y: landmarks[468].y });
          }
        }
      } catch (error) {
        console.error("MediaPipe detection failed temporarily:", error);
      }
    }
    window.requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    if( isZoningOut) {
      triggerAIPause();
    }
  }, [isZoningOut, focusStatus]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#0f172a', minHeight: '100vh', width: '97vw', color: 'white' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>FocusFlow AI</h1>
        {!isReady && <p style={{ color: '#fbbf24' }}>Initializing AI Engine...</p>}
      </header>

      {/* PHASE 1: Calibration Overlay */}
      {!isCalibrated && isReady && (
        <CalibrationUI
          landmarks={currentLandmarks}
          onComplete={(finalBounds) => setBounds(finalBounds)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        {/* Main Content: Video Player */}
        <section>
          <YouTubePlayer
            ref={ytPlayerRef}
            handlePlayerStateChange={handlePlayerStateChange}
          />
          {(zoneOutAlerted || focusStatus === "OUT_OF_FOCUS") && (
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ef4444', borderRadius: '8px' }}>
              <h3>Zoning Out Detected!</h3>
              <p>Are you still focusing on the video? Resume the video to reset.</p>
            </div>
          )}
        </section>

        {/* Sidebar: AI Monitor */}
        <aside style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>AI Insights</h2>

          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <p>Focus Status: <strong style={{ color: focusStatus === 'FOCUSED' ? '#10b981' : '#f43f5e' }}>{focusStatus}</strong></p>
            <p>Spatial Calibration: {isCalibrated ? '✅ DONE' : '❌ PENDING'}</p>
            <p>Stability State: {isZoningOut ? '⚠️ ZONING OUT' : '🟢 ACTIVE'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;