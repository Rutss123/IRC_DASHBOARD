/**
 * WebRTC Stream Manager
 * Encapsulates video stream peer connections, STUN/TURN setups,
 * and media signaling channels.
 */
class RoverStreamManager {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.config = {
      iceServers: [
        { urls: 'ice:stun.l.google.com:19302' }
      ]
    };
  }

  async initializeStream(camId, videoElement) {
    console.log(`[StreamManager] Binding WebRTC stream for camera: ${camId}`);
    
    // Future WebRTC Implementation:
    // const pc = new RTCPeerConnection(this.config);
    // this.peerConnections[camId] = pc;
    // pc.ontrack = (event) => {
    //   if (videoElement) videoElement.srcObject = event.streams[0];
    // };
    // Trigger signalling negotiation with FastAPI peer...
  }

  closeStream(camId) {
    if (this.peerConnections[camId]) {
      this.peerConnections[camId].close();
      delete this.peerConnections[camId];
      console.log(`[StreamManager] Closed stream peer: ${camId}`);
    }
  }

  closeAllStreams() {
    Object.keys(this.peerConnections).forEach(camId => this.closeStream(camId));
  }
}

export const streamManager = new RoverStreamManager();
