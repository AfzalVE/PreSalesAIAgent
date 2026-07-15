import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import { useAppStore } from '../../store/useAppStore';

const VOICE_SIMULATION_STEPS = [
  {
    aiPrompt: "Hi there! I'm the ProposalFlow AI assistant. What are you trying to build?",
    userTranscript: "I want to build a mobile-first premium e-commerce portal called Zenith Retail. It needs a high-end storefront and an AI sizing recommendation engine.",
    extract: { name: "Zenith Retail Portal", domain: "E-Commerce", features: ["High-end Storefront", "AI Sizing Recommendation Engine"], techStack: ["React", "Node.js"] }
  },
  {
    aiPrompt: "That sounds exciting! What budget range are you considering for this project?",
    userTranscript: "We have a budget of around eighty-five thousand dollars for this initial phase.",
    extract: { budget: 85000 }
  },
  {
    aiPrompt: "Understood. What timeline do you have in mind, and do you have any preferred backend technologies?",
    userTranscript: "We need to launch within three months. For backend tech, we prefer Node.js and Postgres database.",
    extract: { timeline: "12 Weeks", techStack: ["React", "Node.js", "PostgreSQL", "OpenAI API"] }
  }
];

export default function VoiceRecorder({ onComplete }) {
  const { updateProjectData } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: "ai", text: VOICE_SIMULATION_STEPS[0].aiPrompt }
  ]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const [extractedData, setExtractedData] = useState({
    name: "Pending...",
    features: [],
    budget: 0,
    timeline: "Pending...",
    techStack: [],
    complexity: "Evaluating..."
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, liveTranscript, isAiThinking]);

  const startVoiceCapture = () => {
    if (isRecording || isAiThinking || currentStep >= VOICE_SIMULATION_STEPS.length) return;
    
    setIsRecording(true);
    setLiveTranscript("");
    
    const stepData = VOICE_SIMULATION_STEPS[currentStep];
    const words = stepData.userTranscript.split(" ");
    let currentWordIndex = 0;
    
    // Simulate words appearing in transcription area in real-time
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setLiveTranscript(prev => prev + (prev ? " " : "") + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
        finishVoiceStep(stepData);
      }
    }, 90);
  };

  const finishVoiceStep = (stepData) => {
    setIsRecording(false);
    setIsAiThinking(true);

    // AI Processes the transcription
    setTimeout(() => {
      setIsAiThinking(false);
      
      // Update chat log
      setChatLog(prev => [
        ...prev,
        { sender: "user", text: stepData.userTranscript }
      ]);
      
      // Update extracted panel parameters
      const updatedExtract = { ...extractedData, ...stepData.extract };
      if (stepData.extract.features) {
        updatedExtract.features = [...extractedData.features, ...stepData.extract.features];
      }
      if (stepData.extract.techStack) {
        updatedExtract.techStack = Array.from(new Set([...extractedData.techStack, ...stepData.extract.techStack]));
      }
      if (currentStep === VOICE_SIMULATION_STEPS.length - 1) {
        updatedExtract.complexity = "Medium-High";
      }
      setExtractedData(updatedExtract);
      setLiveTranscript("");

      // Proceed or set up next question
      const nextStep = currentStep + 1;
      if (nextStep < VOICE_SIMULATION_STEPS.length) {
        setCurrentStep(nextStep);
        setTimeout(() => {
          setChatLog(prev => [
            ...prev,
            { sender: "ai", text: VOICE_SIMULATION_STEPS[nextStep].aiPrompt }
          ]);
        }, 1000);
      } else {
        // Complete collection, push back to store
        updateProjectData({
          name: updatedExtract.name,
          domain: updatedExtract.domain,
          description: "AI-generated from client voice requirements: A premium e-commerce portal named Zenith Retail features mobile optimization and an embedded artificial intelligence engine for clothing recommendation.",
          techStack: updatedExtract.techStack,
          budget: updatedExtract.budget,
          timeline: updatedExtract.timeline,
          complexity: updatedExtract.complexity,
          estimatedTeam: 5
        });
      }
    }, 1500);
  };

  const isFinished = currentStep >= VOICE_SIMULATION_STEPS.length && !isAiThinking;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
      {/* Conversational Screen */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft min-h-[460px]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Voice Session Active</span>
          </div>
          <span className="text-xs font-medium text-neutral-400">Step {Math.min(currentStep + 1, 3)} of 3</span>
        </div>

        {/* Chat History bubble */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 max-h-[250px]">
          {chatLog.map((chat, idx) => (
            <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                chat.sender === 'user'
                  ? 'bg-neutral-900 text-white font-medium rounded-tr-none'
                  : 'bg-neutral-50 text-neutral-800 border border-neutral-200/60 rounded-tl-none'
              }`}>
                {chat.text}
              </div>
            </div>
          ))}

          {/* Live Transcript displaying */}
          {isRecording && (
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-neutral-900/10 text-neutral-800 font-medium rounded-2xl rounded-tr-none px-4 py-3 text-sm italic">
                {liveTranscript}
                <span className="inline-block w-1.5 h-4 bg-brand-500 ml-1 animate-pulse" />
              </div>
            </div>
          )}

          {/* AI Thinking loader */}
          {isAiThinking && (
            <div className="flex justify-start items-center space-x-2 py-2 text-neutral-400 text-xs">
              <Loader2 size={14} className="animate-spin text-brand-500" />
              <span>Analyzing speech parameters...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Waveform and Mic controls */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col items-center">
          <WaveformVisualizer isRecording={isRecording} />
          
          <div className="mt-4 flex items-center space-x-4">
            {!isFinished ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startVoiceCapture}
                disabled={isRecording || isAiThinking}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-brand-500 hover:bg-brand-600 text-white cursor-pointer disabled:opacity-50'
                }`}
              >
                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
              </motion.button>
            ) : (
              <motion.button
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={onComplete}
                className="inline-flex items-center px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 shadow-md transition-all duration-200"
              >
                Generate Blueprints
                <ArrowRight size={16} className="ml-2" />
              </motion.button>
            )}
            
            {!isRecording && !isFinished && !isAiThinking && (
              <span className="text-xs text-neutral-400 font-medium animate-pulse">
                Click microphone to answer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Extracted Metadata Panel */}
      <div className="lg:col-span-5 bg-neutral-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
        
        {/* Mesh Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center space-x-2 pb-4 border-b border-white/10 mb-6">
            <Sparkles size={16} className="text-brand-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">AI Requirement Extraction</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Project Name</label>
              <div className="text-sm font-semibold mt-0.5 text-white/95">
                {extractedData.name}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Domain</label>
              <div className="text-sm font-medium mt-0.5 text-white/80">
                {extractedData.domain || "Evaluating..."}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Extracted Features</label>
              {extractedData.features.length === 0 ? (
                <div className="text-xs italic text-neutral-500 mt-1">Listening for core modules...</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {extractedData.features.map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white/90 text-xs border border-white/5">
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Budget</label>
                <div className="text-sm font-semibold mt-0.5 text-brand-400">
                  {extractedData.budget ? `$${extractedData.budget.toLocaleString()}` : "Pending..."}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Timeline</label>
                <div className="text-sm font-semibold mt-0.5 text-white/90">
                  {extractedData.timeline}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Tech Stack</label>
              {extractedData.techStack.length === 0 ? (
                <div className="text-xs italic text-neutral-500 mt-1">Analyzing preference...</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {extractedData.techStack.map((tech, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-xs border border-brand-500/10">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Complexity Level</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            extractedData.complexity === "Evaluating..." 
              ? 'bg-white/10 text-neutral-300'
              : 'bg-brand-500 text-neutral-900 font-bold'
          }`}>
            {extractedData.complexity}
          </span>
        </div>
      </div>
    </div>
  );
}
