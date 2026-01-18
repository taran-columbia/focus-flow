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
  // const [zoneOutAlerted, setZoneOutAlerted] = useState(false);



  // Spatial Focus Hook: Handles 3-second distraction pause
  const { processFocus, setBounds, isCalibrated } = useSpatialFocus(() => {
    ytPlayerRef.current?.pause(); // AI Command: Pause YouTube
  });

  // Gaze Stability Hook: Handles the "Zoning Out" detection
  const { checkStability, isZoningOut } = useGazeStability(() => {
    // setZoneOutAlerted(true); // Signal to show the "Are you still there?" modal
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
  }, [isZoningOut]);

  const handleRecalibrate = () => {
  setBounds(null); // Triggers the CalibrationUI to reappear
  if (boundsRef) boundsRef.current = null;
  console.log("Recalibrating: Bounds cleared.");
};

const handleSwitchVideo = () => {
  // Clear all video and focus states
  // setEmbedId(""); 
  if (ytPlayerRef.current) {
      ytPlayerRef.current.clearEmbed(); // Clear the current video
  }
  // setZoneOutAlerted(false);
  setFocusStatus("WAITING FOR VIDEO TO PLAY");
  // isPausedRef.current = false;
  console.log("Switching Video: UI reset.");
};

  return (
  <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
    {/* Header & Controls */}
    <header className="flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          FocusFlow AI
        </h1>
        <p className="text-slate-400 text-sm">Academic Video Guard</p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={handleRecalibrate}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600 text-sm font-medium"
        >
          Recalibrate
        </button>
        <button 
          onClick={handleSwitchVideo}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
        >
          New Video
        </button>
      </div>
    </header>

    {/* Calibration Phase */}
    {!isCalibrated && isReady && (
      <CalibrationUI 
        landmarks={currentLandmarks} 
        onComplete={(finalBounds) => {
          setBounds(finalBounds);
          boundsRef.current = finalBounds;
        }} 
      />
    )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Video Section */}
      <div className="lg:col-span-2 space-y-4">
        <YouTubePlayer 
          ref={ytPlayerRef} 
          handlePlayerStateChange={handlePlayerStateChange}
          // Pass the embedId state down if you want to manage URL input in App.js
        />
        
        {/* {zoneOutAlerted && (
          <div className="p-6 bg-red-900/50 border border-red-500/50 rounded-xl animate-pulse">
            <h3 className="text-xl font-bold text-red-200">Zoning Out Detected</h3>
            <p className="text-red-300">Your eyes have been static for too long. Focus back on the content to resume.</p>
          </div>
        )} */}
      </div>

      {/* Monitoring Sidebar */}
      <aside className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit sticky top-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          AI Live Monitor
        </h2>
        
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-slate-700 mb-6">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] uppercase tracking-widest font-bold">
            Live Feed
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">Focus Status</span>
            <span className={focusStatus === "FOCUSED" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {focusStatus}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-700 pb-2">
            <span className="text-slate-400">Gaze Stability</span>
            <span className={isZoningOut ? "text-orange-400 font-bold" : "text-emerald-400 font-bold"}>
              {isPausedRef.current == true ? '-' :isZoningOut ? "STALE" : "DYNAMIC"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
);
}

export default App;