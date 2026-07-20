import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Phone,
  Video,
  ArrowLeft,
  Clock,
  Send,
  User,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Award,
  ShieldCheck,
  Check
} from "lucide-react";

export default function ResourceContactPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeId = searchParams.get("employeeId") || "N/A";
  const employeeName = searchParams.get("employeeName") || "Resource Specialist";
  const employeeRole = searchParams.get("role") || "Senior Developer";

  const [activeMode, setActiveMode] = useState("chat"); // 'chat', 'call', 'video'
  const [timeLeft, setTimeLeft] = useState(5 * 24 * 60 * 60); // 5 days in seconds
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "employee",
      text: `Hello! I'm ${employeeName}. I saw you were reviewing my profile for your project. How can I help you today?`,
      time: "Just now"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  // Calling states
  const [callStatus, setCallStatus] = useState("idle"); // 'idle', 'ringing', 'connected', 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const callTimerRef = useRef(null);

  // 5 days countdown timer simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown
  const formatCountdown = () => {
    const days = Math.floor(timeLeft / (24 * 3600));
    const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Scroll chats to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Call duration counter
  useEffect(() => {
    if (callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: "client",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulate developer typing response
    setTimeout(() => {
      const autoResponses = [
        "That sounds like an interesting feature! We can definitely build that using a secure async pipeline.",
        "For scaling the database, I'd suggest starting with a clean model layout and indexing key columns.",
        "Absolutely. I have experience with this architecture and can implement it within the proposed timeline.",
        "Would you like me to walk you through a brief live demo of a similar project I've delivered?",
        "Great point. We should ensure we have proper unit tests for those endpoints to maintain robustness."
      ];
      const randomReply = autoResponses[Math.floor(Math.random() * autoResponses.length)];
      
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "employee",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  // Trigger calls
  const startAudioCall = () => {
    setActiveMode("call");
    setCallStatus("ringing");
    setTimeout(() => {
      setCallStatus("connected");
    }, 2500);
  };

  const startVideoCall = () => {
    setActiveMode("video");
    setCallStatus("ringing");
    setTimeout(() => {
      setCallStatus("connected");
    }, 2500);
  };

  const hangUpCall = () => {
    setCallStatus("ended");
    setTimeout(() => {
      setCallStatus("idle");
    }, 1500);
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4 md:px-8 font-sans bg-white text-[#0a0a0a] overflow-hidden">
      
      {/* Background Soft Sky gradient header matching Mintlify marketing bands */}
      <div 
        className="absolute top-0 left-0 w-full h-[320px] -z-10 opacity-70 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, #87a8c8 0%, #f5e9d8 60%, #ffffff 100%)"
        }}
      />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Top Breadcrumb & Navbar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-semibold text-[#5a5a5c] hover:text-[#0a0a0a] transition-colors cursor-pointer bg-white border border-[#e5e5e5] px-4 py-2 rounded-full shadow-xs"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Proposal Preview
          </button>
          
          <div className="flex items-center space-x-2 bg-[#00d4a4] text-[#0a0a0a] px-4 py-2 rounded-full font-bold shadow-sm text-xs border border-[#00b48a]/10">
            <Clock size={14} className="flex-shrink-0 animate-pulse text-[#0a0a0a]" />
            <span>Trial Time: {formatCountdown()}</span>
          </div>
        </div>

        {/* 3-Column Mintlify Layout split */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Sidebar / Profile (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#e5e5e5] rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              <div className="text-center pb-6 border-b border-[#e5e5e5]">
                {/* Profile Circle Accent */}
                <div className="w-20 h-20 rounded-full bg-[#0a0a0a] flex items-center justify-center mx-auto text-2xl font-black shadow-md text-white mb-4">
                  {employeeName.charAt(0)}
                </div>
                <h2 className="text-lg font-bold text-[#0a0a0a] tracking-tight">{employeeName}</h2>
                <p className="text-xs text-[#5a5a5c] font-semibold mt-1 uppercase tracking-wider">{employeeRole}</p>
                <div className="inline-flex items-center mt-3 px-3 py-1 rounded bg-[#f7f7f7] border border-[#e5e5e5] text-xs font-mono text-[#3a3a3c]">
                  <Award size={12} className="mr-1.5 text-[#00d4a4]" /> ID: {employeeId.split("-")[0]}
                </div>
              </div>

              {/* Mode Selectors as Secondary Pill Buttons */}
              <div className="space-y-4">
                <h4 className="text-[11px] uppercase font-bold text-[#888888] tracking-wider font-mono">
                  Select channel
                </h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setActiveMode("chat");
                      if (callStatus !== "idle") hangUpCall();
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                      activeMode === "chat"
                        ? "bg-[#00d4a4] border-[#00d4a4] text-[#0a0a0a] shadow-sm font-bold"
                        : "bg-white border-[#e5e5e5] text-[#5a5a5c] hover:text-[#0a0a0a]"
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span>Developer Text Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeMode !== "call") startAudioCall();
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                      activeMode === "call"
                        ? "bg-[#00d4a4] border-[#00d4a4] text-[#0a0a0a] shadow-sm font-bold"
                        : "bg-white border-[#e5e5e5] text-[#5a5a5c] hover:text-[#0a0a0a]"
                    }`}
                  >
                    <Phone size={16} />
                    <span>Voice Call Simulation</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeMode !== "video") startVideoCall();
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                      activeMode === "video"
                        ? "bg-[#00d4a4] border-[#00d4a4] text-[#0a0a0a] shadow-sm font-bold"
                        : "bg-white border-[#e5e5e5] text-[#5a5a5c] hover:text-[#0a0a0a]"
                    }`}
                  >
                    <Video size={16} />
                    <span>Video Consultation</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-4 text-[11px] leading-relaxed text-[#5a5a5c]">
              <p className="font-bold text-[#0a0a0a] text-xs mb-1.5 flex items-center">
                <ShieldCheck size={14} className="mr-1 text-[#00d4a4]" /> 
                Trial Guidelines
              </p>
              This 5-day trial grants direct access to matched developers so you can verify competency and align project parameters.
            </div>
          </div>

          {/* Right Column: High-density prose & interaction panel (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between min-h-[500px]">
            
            {/* Header with active status indicators */}
            <div className="bg-[#f7f7f7] px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center font-bold text-xs text-[#00d4a4]">
                  {employeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0a0a0a]">{employeeName}</h3>
                  <p className="text-[11px] text-[#5a5a5c]">{employeeRole}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4a4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00d4a4]"></span>
                </span>
                <span className="text-[10px] font-bold text-[#00b48a] uppercase tracking-wider font-mono">Live</span>
              </div>
            </div>

            {/* Content body */}
            <div className="flex-1 p-6 relative flex flex-col justify-center bg-white">
              
              {/* CHAT CHANNEL */}
              {activeMode === "chat" && (
                <div className="flex flex-col h-[350px] justify-between">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {chatMessages.map((msg, idx) => {
                      const isClient = msg.sender === "client";
                      return (
                        <div
                          key={idx}
                          className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-xl p-3 text-xs leading-relaxed ${
                              isClient
                                ? "bg-[#0a0a0a] text-white rounded-tr-none"
                                : "bg-[#f7f7f7] border border-[#e5e5e5] text-[#1c1c1e] rounded-tl-none"
                            }`}
                          >
                            <div className="flex justify-between items-center space-x-6 mb-1 text-[9px] opacity-70">
                              <span className="font-bold">
                                {isClient ? "You (Client)" : employeeName}
                              </span>
                              <span>{msg.time}</span>
                            </div>
                            <p className="font-sans leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form */}
                  <div className="mt-4 flex items-center space-x-2 bg-[#f7f7f7] p-1.5 rounded-full border border-[#e5e5e5]">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendChatMessage();
                      }}
                      placeholder="Type your parameter inquiry..."
                      className="flex-1 bg-transparent text-xs outline-none px-4 py-2 text-[#0a0a0a] placeholder-[#888888]"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="p-2.5 rounded-full bg-[#0a0a0a] hover:bg-[#1c1c1e] text-white cursor-pointer transition-colors shadow-xs"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* AUDIO VOICE CALL */}
              {activeMode === "call" && (
                <div className="flex flex-col items-center justify-center space-y-8 py-6">
                  {callStatus === "ringing" && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center animate-bounce shadow-xs">
                        <Phone size={24} className="text-[#00d4a4]" />
                      </div>
                      <p className="text-xs font-bold text-[#5a5a5c] animate-pulse">Ringing matched resource...</p>
                    </div>
                  )}

                  {callStatus === "connected" && (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center relative shadow-sm">
                        <div className="absolute inset-0 rounded-full border border-[#00d4a4]/30 animate-ping"></div>
                        <User size={32} className="text-[#5a5a5c]" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-[#0a0a0a]">{employeeName}</h4>
                        <p className="text-xs font-mono text-[#00d4a4] mt-1 font-bold bg-[#00d4a4]/10 px-3 py-1 rounded-full">{formatDuration(callDuration)}</p>
                      </div>

                      {/* Call Action buttons as outline/solid pills */}
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-3 rounded-full border cursor-pointer transition-colors ${
                            isMuted
                              ? "bg-red-50 border-red-200 text-red-600"
                              : "bg-white border-[#e5e5e5] text-[#5a5a5c] hover:bg-[#f7f7f7]"
                          }`}
                        >
                          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>

                        <button
                          onClick={hangUpCall}
                          className="px-6 py-3 rounded-full bg-red-650 hover:bg-red-700 text-white cursor-pointer transition-all hover:scale-105 shadow-sm font-bold text-xs flex items-center space-x-1.5"
                        >
                          <PhoneOff size={14} />
                          <span>Hang up</span>
                        </button>

                        <button
                          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                          className={`p-3 rounded-full border cursor-pointer transition-colors ${
                            !isSpeakerOn
                              ? "bg-red-50 border-red-200 text-red-600"
                              : "bg-white border-[#e5e5e5] text-[#5a5a5c] hover:bg-[#f7f7f7]"
                          }`}
                        >
                          {isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {callStatus === "ended" && (
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-xs font-bold text-red-500">Call Ended</p>
                      <p className="text-[10px] text-[#888888]">Trial connection terminated.</p>
                    </div>
                  )}

                  {callStatus === "idle" && (
                    <div className="flex flex-col items-center space-y-4">
                      <button
                        onClick={startAudioCall}
                        className="px-6 py-3 rounded-full bg-[#0a0a0a] hover:bg-[#1c1c1e] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-2"
                      >
                        <Phone size={14} />
                        <span>Start Trial Audio Call</span>
                      </button>
                      <p className="text-[10px] text-[#888888] font-mono">Secure demo trial voice call</p>
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO CONSULTATION */}
              {activeMode === "video" && (
                <div className="flex flex-col items-center justify-center space-y-6 py-2">
                  {callStatus === "ringing" && (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center animate-bounce shadow-xs">
                        <Video size={24} className="text-[#00d4a4]" />
                      </div>
                      <p className="text-xs font-bold text-[#5a5a5c] animate-pulse">Requesting video stream...</p>
                    </div>
                  )}

                  {callStatus === "connected" && (
                    <div className="relative w-full aspect-video rounded-xl border border-[#e5e5e5] overflow-hidden bg-neutral-950 flex flex-col justify-end p-4 shadow-sm">
                      {/* Big video feed simulation (Developer) */}
                      {!isVideoMuted ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-[#1a3d4a] to-[#2d5a4f]">
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-[#00d4a4] flex items-center justify-center mx-auto text-xl font-black text-[#0a0a0a] shadow-md animate-pulse">
                              {employeeName.charAt(0)}
                            </div>
                            <h4 className="text-xs font-bold text-[#00d4a4] tracking-tight">{employeeName} is presenting...</h4>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] text-neutral-500 text-xs">
                          Camera feed offline
                        </div>
                      )}

                      {/* Small PiP Video Feed (Client) */}
                      <div className="absolute top-4 right-4 w-28 h-20 rounded-xl border border-[#e5e5e5]/20 bg-[#0a0a0a] overflow-hidden shadow-2xl flex items-center justify-center text-[9px] text-[#5a5a5c] font-mono">
                        Client Webcam
                      </div>

                      {/* Overlay Controls */}
                      <div className="relative z-10 flex items-center justify-center space-x-3 bg-white/95 backdrop-blur-sm py-2 px-4 rounded-full border border-[#e5e5e5] max-w-xs mx-auto mb-2 shadow-sm">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-2 rounded-full cursor-pointer ${
                            isMuted ? "bg-red-50 text-red-650" : "bg-[#f7f7f7] text-[#0a0a0a] hover:bg-[#e5e5e5]"
                          }`}
                        >
                          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>

                        <button
                          onClick={() => setIsVideoMuted(!isVideoMuted)}
                          className={`p-2 rounded-full cursor-pointer ${
                            isVideoMuted ? "bg-red-50 text-red-650" : "bg-[#f7f7f7] text-[#0a0a0a] hover:bg-[#e5e5e5]"
                          }`}
                        >
                          <VideoOff size={14} />
                        </button>

                        <button
                          onClick={hangUpCall}
                          className="px-4 py-2 rounded-full bg-red-650 hover:bg-red-700 text-white cursor-pointer transition-all text-xs font-bold"
                        >
                          End Call
                        </button>
                      </div>
                    </div>
                  )}

                  {callStatus === "ended" && (
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-xs font-bold text-red-500">Call Ended</p>
                      <p className="text-[10px] text-[#888888]">Trial connection terminated.</p>
                    </div>
                  )}

                  {callStatus === "idle" && (
                    <div className="flex flex-col items-center space-y-4">
                      <button
                        onClick={startVideoCall}
                        className="px-6 py-3 rounded-full bg-[#0a0a0a] hover:bg-[#1c1c1e] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-2"
                      >
                        <Video size={14} />
                        <span>Start Trial Video Call</span>
                      </button>
                      <p className="text-[10px] text-[#888888] font-mono">Secure demo trial video link</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
