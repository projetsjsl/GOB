
// This service manages the HeyGen Streaming Avatar connection
export class HeyGenService {
  private peerConnection: RTCPeerConnection | null = null;
  private sessionId: string | null = null;
  private token: string;
  private avatarId: string;
  private quality: string;
  private emotion: string;
  private removeBackground: boolean;

  constructor(
    token: string, 
    avatarId: string, 
    quality: string = 'medium',
    emotion: string = 'Friendly',
    removeBackground: boolean = false
  ) {
    this.token = token;
    this.avatarId = avatarId;
    this.quality = quality;
    this.emotion = emotion;
    this.removeBackground = removeBackground;
  }

  async createSession(): Promise<{ sessionId: string, sdp: RTCSessionDescriptionInit, ice_servers: RTCIceServer[] }> {
    console.log(`Creating HeyGen session for avatar: ${this.avatarId} (${this.quality}, ${this.emotion})`);
    
    const response = await fetch('https://api.heygen.com/v1/streaming.new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        quality: this.quality,
        avatar_name: this.avatarId,
        voice: { 
            rate: 1.0, 
            emotion: this.emotion 
        },
        version: 'v2',
        video_encoding: 'H264',
        disable_idle_timeout: true, // Keep connection alive for kiosk mode
        background: this.removeBackground ? { color: "#00FF00" } : undefined // Mocking background removal request
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`HeyGen Session Error: ${response.statusText} - ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.data; // Expected { sdp: ..., session_id: ..., ice_servers: ... }
  }

  async startSession(videoElement: HTMLVideoElement): Promise<void> {
    try {
      const sessionData = await this.createSession();
      this.sessionId = sessionData.sessionId;

      this.peerConnection = new RTCPeerConnection({
        iceServers: sessionData.ice_servers || [],
      });

      // Handle incoming tracks
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          videoElement.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          this.sendIceCandidate(candidate);
        }
      };

      // Set Remote Description (SDP Offer from HeyGen)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sessionData.sdp));

      // Create Answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Start the stream
      await fetch('https://api.heygen.com/v1/streaming.start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          sdp: answer,
        }),
      });

      console.log('HeyGen Session Started');
    } catch (e) {
      console.error('HeyGen connection failed', e);
      throw e;
    }
  }

  async sendIceCandidate(candidate: RTCIceCandidate) {
    if (!this.sessionId) return;
    await fetch('https://api.heygen.com/v1/streaming.ice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        session_id: this.sessionId,
        candidate: candidate,
      }),
    });
  }

  async speak(text: string) {
    if (!this.sessionId) return;
    // Repeat mode or Task mode depending on HeyGen API version
    // console.log("Sending text to HeyGen:", text);
    try {
        await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
            session_id: this.sessionId,
            text: text,
        }),
        });
    } catch(e) {
        console.error("Failed to send speak task", e);
    }
  }

  async close() {
    if (this.sessionId) {
       try {
        await fetch('https://api.heygen.com/v1/streaming.stop', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify({ session_id: this.sessionId }),
        });
       } catch(e) { console.warn(e) }
    }
    this.peerConnection?.close();
    this.peerConnection = null;
    this.sessionId = null;
  }
}
