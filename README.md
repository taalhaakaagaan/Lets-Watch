# Let's Watch 🍿

**Let's Watch** is a real-time, P2P video synchronization application built with Electron, React, and WebRTC. It allows a host to stream a local video file to multiple viewers with synchronized playback controls (play, pause, seek).

## Features ✨

*   **Local Video Hosting:** Host creates a room and selects a video file from their computer.
*   **P2P Streaming:** Video and data are streamed directly between peers using WebRTC (Simple-Peer).
*   **Synchronized Playback:** Play, pause, and seek events are synced instantly across all viewers.
*   **Real-time Chat:** Integrated chat room for viewers to discuss the movie.
*   **Room Management:**
    *   Secure rooms with password protection.
    *   Kick/Ban functionality (Host only).
    *   Room ID generation for easy sharing.
*   **Premium UI:** "Cinema Mode" interface with dark theme, countdowns, and immersive visuals.

## Tech Stack 🛠️

*   **Electron:** Desktop application wrapper.
*   **React:** UI and component management.
*   **Socket.io:** Signaling server for establishing WebRTC connections.
*   **Simple-Peer:** WebRTC implementation for video/data streaming.
*   **Vite:** Fast build tool and dev server.

## Installation 📦

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/taalhaakaagaan/Lets-Watch.git
    cd Lets-Watch
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    cd client
    npm install
    ```

3.  **Run Development Mode:**
    To run the client and Electron app concurrently:
    ```bash
    # Root directory
    npm run electron
    ```
    *(Note: Ensure the client dev server is running if not using the concurrent script)*

4.  **Build for Production:**
    ```bash
    npm run dist
    ```

## Usage 🚀

1.  **Host:**
    *   Click "Create Room".
    *   Select a video file (`.mp4`, `.mkv`, etc.).
    *   Configure room settings (Name, Private/Public).
    *   Share the **Room ID** copied from the header.
    *   Click "Start Movie" to begin the countdown!

2.  **Viewer:**
    *   Enter the **Room ID** (and password if private) on the dashboard.
    *   Click "Join Room".
    *   Wait for the host to start the movie.

## License 📄

This project is licensed under the ISC License.
