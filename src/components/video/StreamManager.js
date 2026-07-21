/**
 * WebRTC Stream Manager (MediaMTX WHEP Implementation)
 */
class RoverStreamManager {
  constructor() {
    this.peerConnections = {};
    // Point this to your Jetson's IP address and MediaMTX WebRTC port
    this.JETSON_IP = "0.0.0.252"
    this.WHEP_PORT = "8889";
  }

  async initializeStream(camId, videoElement) {
    console.log(`[StreamManager] Binding WebRTC stream for camera: ${camId}`);
    
    // 1. Create the WebRTC Peer Connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.peerConnections[camId] = pc;

    // 2. Tell it we only want to receive video (no sending mic/video back)
    pc.addTransceiver('video', { direction: 'recvonly' });

    // 3. When the Jetson sends frames, attach them to the HTML video tag
    pc.ontrack = (event) => {
      if (videoElement && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      }
    };

    try {
      // 4. Create an offer and send it to MediaMTX
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(`http://${this.JETSON_IP}:${this.WHEP_PORT}/${camId}/whep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`MediaMTX rejected connection: ${response.statusText}`);
      }

      // 5. Accept the Jetson's answer and finalize the connection
      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });
      
      console.log(`[StreamManager] WebRTC Connected for ${camId}!`);

    } catch (error) {
      console.error(`[StreamManager] Failed to fetch stream for ${camId}:`, error);
      this.closeStream(camId);
    }
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