import { ArrowLeft } from 'lucide-react';
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
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveStep(0)}
              className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Voice Input</span>
          </div>
        </div>

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
