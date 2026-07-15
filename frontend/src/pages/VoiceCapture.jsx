import { useAppStore } from '../store/useAppStore';
import VoiceRecorder from '../components/voice/VoiceRecorder';
import FloatingBackground from '../components/common/FloatingBackground';

export default function VoiceCapture() {
  const { setActiveStep } = useAppStore();

  const handleVoiceComplete = () => {
    setActiveStep(3); // Route to requirements summary page
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />
      
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-900">
            Tell Us What You're Building
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Say what you need in your own words. The AI broker will transcribe and extract essential technical nodes in real-time.
          </p>
        </div>

        <VoiceRecorder onComplete={handleVoiceComplete} />
      </div>
    </div>
  );
}
