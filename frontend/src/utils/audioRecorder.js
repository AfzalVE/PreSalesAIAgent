const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
  * Helper class to manage microphone recording via Web MediaRecorder API
  */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    
    // Choose appropriate mime type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(200); // Collect data every 200ms
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("Recorder not initialized."));
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
        // Stop all audio tracks to release microphone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}

/**
 * Transcribes audio blob using backend OpenAI Whisper API endpoint
 */
export async function transcribeWithWhisper(audioBlob) {
  const formData = new FormData();
  const fileExtension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
  formData.append('file', audioBlob, `speech.${fileExtension}`);

  const response = await fetch(`${API_BASE}/api/v1/ai-agent/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Voice transcription failed.");
  }

  const data = await response.json();
  return data.transcript || "";
}
