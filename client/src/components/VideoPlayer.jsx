import React, { useRef, useEffect } from 'react';
import './VideoPlayer.css';


const VideoPlayer = React.forwardRef(({ mode, stream, isHost, src, onFileChange, onPlay, onPause, onSeek }, ref) => {
    // Determine which ref to use (internal or external) - but here we expect external.
    // If ref is not passed, we might need a fallback, but Room.jsx passes it.

    // To safe guard, we can use useImperativeHandle or just assume ref is present.
    // However, for simple video element ref, just passing it to the <video> tag is enough.

    useEffect(() => {
        if (ref && ref.current) {
            if (stream) {
                ref.current.srcObject = stream;
            } else {
                ref.current.srcObject = null;
                if (isHost && src) {
                    ref.current.src = src;
                }
            }
        }
    }, [stream, isHost, src, ref]);

    return (
        <div className="video-wrapper">
            <video
                ref={ref}
                controls={isHost && !stream}
                className="main-video"
                onPlay={onPlay}
                onPause={onPause}
                onSeeked={onSeek}
                muted={isHost && !!stream} // Mute local if sharing
            />

            {!isHost && !stream && (
                <div className="waiting-overlay">
                    <div className="loader"></div>
                    <h3>Waiting for Host to start movie...</h3>
                </div>
            )}
        </div>
    );
});

export default VideoPlayer;
