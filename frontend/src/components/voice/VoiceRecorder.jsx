import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import { useAppStore } from '../../store/useAppStore';

export default function VoiceRecorder({ onComplete }) {
  const { updateProjectData } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: "ai", text: "Hi there! I'm the ProposalFlow AI assistant. What are you trying to build? Please speak your requirements." }
  ]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const [extractedData, setExtractedData] = useState({
    name: "Pending...",
    features: [],
    budget: null,
    timeline: "Pending...",
    techStack: [],
    complexity: "Evaluating..."
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, liveTranscript, isAiThinking]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setLiveTranscript(currentTranscript);
      };
      
      rec.onerror = (e) => {
        console.error(e);
        setIsRecording(false);
      };
      
      setRecognition(rec);
    }
  }, []);

  const startVoiceCapture = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      processVoiceInput();
    } else {
      setLiveTranscript("");
      recognition.start();
      setIsRecording(true);
      setHasInteracted(true);
    }
  };

  const processVoiceInput = async () => {
    if (!liveTranscript.trim()) return;
    
    const userText = liveTranscript.trim();
    setChatLog(prev => [...prev, { sender: "user", text: userText }]);
    setLiveTranscript("");
    setIsAiThinking(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/ai-agent/extract-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText })
      });
      const data = await res.json();
      
      // Update extracted panel
      setExtractedData(prev => ({
        name: data.project_name || prev.name,
        features: [], // Since backend doesn't explicitly return features in the new schema, we just clear or keep.
        budget: data.client_budget !== null ? data.client_budget : prev.budget,
        timeline: data.timeline_weeks ? `${data.timeline_weeks} Weeks` : prev.timeline,
        techStack: data.resource_requirements ? data.resource_requirements.flatMap(r => r.skills) : prev.techStack,
        complexity: "Analyzed"
      }));

      // Update AI chat
      let reply = "Got it! Your requirements have been updated.";
      if (data.follow_up_message) {
        reply = data.follow_up_message;
      }
      setChatLog(prev => [...prev, { sender: "ai", text: reply }]);

      // Push to store
      updateProjectData({
        name: data.project_name || extractedData.name,
        budget: data.client_budget !== null ? data.client_budget : extractedData.budget,
        timeline: data.timeline_weeks ? `${data.timeline_weeks} Weeks` : extractedData.timeline,
        estimatedTeam: data.resource_requirements ? data.resource_requirements.reduce((acc, curr) => acc + curr.count, 0) : 0
      });

    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, { sender: "ai", text: "Error connecting to AI service." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
      {/* Conversational Screen */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft min-h-[460px]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-neutral-300'}`} />
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {isRecording ? "Voice Session Active" : "Voice Input"}
            </span>
          </div>
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
          {isRecording && liveTranscript && (
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
              <span>Analyzing requirements with backend AI...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Waveform and Mic controls */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col items-center">
          <WaveformVisualizer isRecording={isRecording} />
          
          <div className="mt-4 flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startVoiceCapture}
              disabled={isAiThinking}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-brand-500 hover:bg-brand-600 text-white cursor-pointer disabled:opacity-50'
              }`}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </motion.button>
            
            {hasInteracted && !isRecording && !isAiThinking && (
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
            
            {!isRecording && !isAiThinking && !hasInteracted && (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Budget</label>
                <div className="text-sm font-semibold mt-0.5 text-brand-400">
                  {extractedData.budget !== null ? `$${extractedData.budget.toLocaleString()}` : "Pending Employee Module"}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Timeline</label>
                <div className="text-sm font-semibold mt-0.5 text-white/90">
                  {extractedData.timeline !== "Pending..." ? extractedData.timeline : "Pending Employee Module"}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Required Skills (Tech Stack)</label>
              {extractedData.techStack.length === 0 ? (
                <div className="text-xs italic text-neutral-500 mt-1">Analyzing...</div>
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
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Status</span>
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
