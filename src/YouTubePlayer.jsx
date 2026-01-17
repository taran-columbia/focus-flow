import React, { useState, useRef, useEffect } from 'react';

export const YouTubePlayer = ({lostFocus = false}) => {
  const [urlInput, setUrlInput] = useState('');
  const [embedId, setEmbedId] = useState('');
  const playerRef = useRef(null);

  // 1. Load the YouTube API Script (The "Enabler")
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  const handleConfirm = () => {
    // Basic ID extraction logic
    const id = urlInput.split('v=')[1]?.split('&')[0] || urlInput.split('youtu.be/')[1];
    if (id) {
      setEmbedId(id);
      // We wait for the iframe to exist, then "bind" the controller to it
      setTimeout(() => {
        playerRef.current = new window.YT.Player('yt-iframe-id');
      }, 1000);
    }
  };

  // --- THESE ARE THE PROGRAMMATIC CALLS YOU NEED ---
  const handlePlay = () => playerRef.current?.playVideo();
  const handlePause = () => playerRef.current?.pauseVideo();

  useEffect(()=>{
    if(lostFocus){
      handlePause();
    } else {
      handlePlay();
    }
  },[lostFocus]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {!embedId ? (
        <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
          <input 
            type="text" 
            placeholder="Paste YouTube Link..." 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ padding: '10px', width: '300px' }}
          />
          <button onClick={handleConfirm} style={{ padding: '10px 20px', marginLeft: '10px' }}>
            Load
          </button>
        </div>
      ) : (
        <div>
          {/* THE IFRAME */}
          <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', maxWidth: '700px' }}>
            {/* <iframe
              id="yt-iframe-id"
              src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0"
            ></iframe> */}
            <iframe
              id="yt-iframe-id"
              src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&origin=${window.location.origin}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              // ADD THESE ATTRIBUTES:
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            ></iframe>
          </div>

          {/* PROGRAMMATIC CONTROL BUTTONS */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={handlePlay} 
              style={{ padding: '10px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              PROGRAMMATIC PLAY
            </button>
            <button 
              onClick={handlePause} 
              style={{ padding: '10px 30px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              PROGRAMMATIC PAUSE
            </button>
          </div>
          <button onClick={() => setEmbedId('')} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
            Change Video
          </button>
        </div>
      )}
    </div>
  );
};