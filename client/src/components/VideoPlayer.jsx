import React, { useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ mode, stream, isHost, src, onFileChange, onPlay, onPause, onSeek, videoRef }) => {

    useEffect(() => {
        if (videoRef.current) {
            if (isHost && src) {
                videoRef.current.src = src;
            } else if (!isHost && stream) {
                videoRef.current.srcObject = stream;
            }
        }
    }, [stream, isHost, src]);

    return (
        <div className="video-wrapper">
            <video
                ref={videoRef}
                controls={isHost} // Only host has native controls initially
                className="main-video"
                onPlay={onPlay}
                onPause={onPause}
                onSeeked={onSeek}
            />

            {!isHost && !stream && (
                <div className="waiting-overlay">
                    <div className="loader"></div>
                    <h3>Waiting for Host to start movie...</h3>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
