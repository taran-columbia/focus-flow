// YouTubePlayer.jsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export const YouTubePlayer = forwardRef(({ handlePlayerStateChange }, ref) => {
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
    play: () => playerRef.current?.playVideo()
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
        <div className="p-4 bg-slate-100 rounded">
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="YouTube Link" />
          <button onClick={handleConfirm}>Load</button>
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