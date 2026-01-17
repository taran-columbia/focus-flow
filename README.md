# FocusFlow AI 👁️📺

FocusFlow is a AI-powered "Study Guard" designed for video content. It utilizes MediaPipe Face Landmarker and Blendshapes to monitor gaze patterns and automatically manage video playback to ensure active engagement.

## ✨ Key Features
- **Spatial Gaze Tracking:** Calibrates a personal "Focus Zone" using an Iris-to-Eye-Corner Ratio system, making the detection robust to slight head movements.
- **Smart Pause (3s Buffer):** Automatically pauses video if the user looks away or closes their eyes for more than 5 continuous seconds.
- **Zoning Out Detection:** Monitors gaze stability using standard deviation to identify when a user is "staring through" the screen rather than processing information.
- **Responsive Dashboard:** Built with React and Tailwind CSS, featuring a live monitor feed and integrated YouTube IFrame API control.

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS
- **AI/ML:** MediaPipe Solutions (Face Landmarker, Blendshapes)
- **Video:** YouTube IFrame Player API
- **Algorithms:** Relative Coordinate Mapping, Temporal Thresholding for Blink/Sleep detection.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Modern web browser with webcam access

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/taran-columbia/focus-flow](https://github.com/taran-columbia/focus-flow)
   cd focus-flow
2. Install packages using npm and run ``` npm run dev

### Useful Resources

1. MediaPipe Landmarks [https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png] (https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png)