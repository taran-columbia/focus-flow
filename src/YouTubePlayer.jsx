// YouTubePlayer.jsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export const YouTubePlayer = forwardRef(({ handlePlayerStateChange,  }, ref) => {
  const [urlInput, setUrlInput] = useState('');
  const [embedId, setEmbedId] = useState('');
  const playerRef = useRef(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  // Expose controls to App.js
  useImperativeHandle(ref, () => ({
    pause: () => playerRef.current?.pauseVideo(),
    play: () => playerRef.current?.playVideo(),
    clearEmbed: () => setEmbedId('')
  }));

  // const handleConfirm = () => {
  //   // Basic ID extraction logic
  //   const id = urlInput.split('v=')[1]?.split('&')[0] || urlInput.split('youtu.be/')[1];
  //   if (id) {
  //     setEmbedId(id);
  //     // We wait for the iframe to exist, then "bind" the controller to it
  //     setTimeout(() => {
  //       playerRef.current = new window.YT.Player('yt-iframe-id');
  //     }, 1000);
  //   }
  // };

  const handleConfirm = () => {
    // const id = urlInput.split('v=')[1]?.split('&')[0] || urlInput.split('youtu.be/')[1];
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = urlInput.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    console.log(id, urlInput);

    if (id) {
      setEmbedId(id);
      setTimeout(() => {
        playerRef.current = new window.YT.Player('yt-iframe-id', {
          events: {
            'onStateChange': (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                handlePlayerStateChange(false); // isPaused = false
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                handlePlayerStateChange(true);  // isPaused = true
                // if (onManualPauseReset) onManualPauseReset();
              }
              // if (event.data === window.YT.PlayerState.PAUSED) {
              //   if (onManualPlay) onManualPlay(); // RESET AI ALERTS HERE
              // }
            }
          }
        });
      }, 1000);
    }
  };

  return (
    <div>
      {!embedId ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Ready to Study?</h3>
            <p className="text-slate-400 text-sm">Enter a YouTube URL to start the AI Focus Guard</p>
          </div>

          <div className="flex w-full max-w-lg gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-slate-900/80 border border-slate-600 text-slate-100 px-4 py-3 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                 placeholder:text-slate-600 transition-all shadow-inner"
            />
            <button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl 
                 font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              Load Video
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <iframe id="yt-iframe-id" src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&origin=${window.location.origin}`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
});