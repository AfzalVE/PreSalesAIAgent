import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Phone,
  Video,
  Send,
  User,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff
} from "lucide-react";

export default function DeveloperContactTestPage() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId") || "employee-123";
  const employeeName = searchParams.get("employeeName") || "Test Developer";
  
  // We don't know the client ID until they message/call us
  const [activeClientId, setActiveClientId] = useState(null);

  const [activeMode, setActiveMode] = useState("chat");
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  const [callStatus, setCallStatus] = useState("idle"); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const ws = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const backendHost = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    
    // Connect as the employee
    ws.current = new WebSocket(`${wsProtocol}//${backendHost}/api/v1/chats/ws/${employeeId}`);

    ws.current.onopen = () => console.log("Developer WebSocket Connected");
    
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Dev WS Received:", data);
      
      // The sender is the client
      const senderId = data.sender_id;
      if (senderId && !activeClientId) {
        setActiveClientId(senderId);
      }

      if (data.type === "chat") {
        setChatMessages(prev => [...prev, {
          sender: "client",
          text: data.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else if (data.type === "call_offer") {
        setActiveClientId(senderId);
        handleIncomingCall(data.content, data.isVideo, senderId);
      } else if (data.type === "call_answer") {
        await handleCallAnswer(data.content);
      } else if (data.type === "ice_candidate") {
        await handleIceCandidate(data.content);
      } else if (data.type === "end_call") {
        hangUpCall(false);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
      if (pc.current) pc.current.close();
      if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
    };
  }, [employeeId, activeClientId]);

  useEffect(() => {
    if (activeClientId) {
      const fetchHistory = async () => {
        try {
          const backendHost = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
          const res = await fetch(`http://${backendHost}/api/v1/chats/history/${activeClientId}/${employeeId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              setChatMessages(data);
            }
          }
        } catch (err) {
          console.error("Failed to fetch chat history", err);
        }
      };
      fetchHistory();
    }
  }, [activeClientId, employeeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !activeClientId) return;

    const myMsg = {
      sender: "employee",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, myMsg]);
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "chat",
        target_id: activeClientId,
        content: chatInput.trim()
      }));
    }

    setChatInput("");
  };

  const [remoteStream, setRemoteStream] = useState(null);

  const setupWebRTC = async (isVideo) => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.current.onicecandidate = (event) => {
      if (event.candidate && ws.current && activeClientId) {
        ws.current.send(JSON.stringify({
          type: "ice_candidate",
          target_id: activeClientId,
          content: event.candidate
        }));
      }
    };

    pc.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      
      localStream.current.getTracks().forEach(track => {
        pc.current.addTrack(track, localStream.current);
      });

      if (isVideo && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  };

  useEffect(() => {
    if (remoteStream) {
      if (activeMode === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (activeMode === "call" && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, activeMode, callStatus]);

  const handleIncomingCall = async (offer, isVideo, clientIdToCall) => {
    setActiveMode(isVideo ? "video" : "call");
    setCallStatus("connected"); 
    await setupWebRTC(isVideo);
    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);
    
    ws.current.send(JSON.stringify({
      type: "call_answer",
      target_id: clientIdToCall || activeClientId,
      content: answer
    }));
  };

  const handleCallAnswer = async (answer) => {
    setCallStatus("connected");
    if (pc.current) {
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (pc.current) {
      await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const hangUpCall = (emit = true) => {
    setCallStatus("ended");
    
    if (emit && ws.current && activeClientId) {
      ws.current.send(JSON.stringify({
        type: "end_call",
        target_id: activeClientId,
        content: "ended"
      }));
    }

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }

    setTimeout(() => {
      setCallStatus("idle");
      setActiveMode("chat");
    }, 1500);
  };

  useEffect(() => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoMuted;
      });
    }
  }, [isVideoMuted]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-teal-400">Developer Testing Terminal</h1>
            <p className="text-sm text-gray-400 mt-1">Logged in as: <strong>{employeeName}</strong> (ID: {employeeId})</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Client ID</p>
            <p className="font-mono text-sm text-teal-300 bg-gray-900 px-3 py-1 rounded-md mt-1 inline-block">
              {activeClientId || "Waiting for client connection..."}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg min-h-[500px] flex flex-col">
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-gray-700 pb-4">
            <button 
              onClick={() => setActiveMode("chat")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeMode === 'chat' ? 'bg-teal-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Text Chat
            </button>
            <button 
              onClick={() => setActiveMode("call")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeMode === 'call' ? 'bg-teal-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Voice Call
            </button>
            <button 
              onClick={() => setActiveMode("video")}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeMode === 'video' ? 'bg-teal-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Video Call
            </button>
          </div>

          <div className="flex-1 flex flex-col relative">
            
            {activeMode === "chat" && (
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "employee" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.sender === "employee" ? "bg-teal-600 text-white rounded-tr-none" : "bg-gray-700 text-gray-200 rounded-tl-none"}`}>
                        <div className="text-[10px] opacity-60 mb-1 flex justify-between">
                          <span>{msg.sender === "employee" ? "You" : "Client"}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                    disabled={!activeClientId}
                    placeholder={activeClientId ? "Type response..." : "Wait for client..."}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 disabled:opacity-50"
                  />
                  <button 
                    onClick={handleSendChatMessage}
                    disabled={!activeClientId}
                    className="bg-teal-500 text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-teal-400 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {(activeMode === "call" || activeMode === "video") && (
              <div className="flex-1 flex flex-col items-center justify-center">
                {callStatus === "idle" && (
                  <div className="text-gray-400">Waiting for incoming {activeMode} call...</div>
                )}
                
                {callStatus === "connected" && activeMode === "video" && (
                  <div className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 w-32 h-24 bg-gray-900 border border-gray-600 rounded-md overflow-hidden">
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {callStatus === "connected" && activeMode === "call" && (
                  <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center animate-pulse border-4 border-teal-500">
                    <User size={48} className="text-teal-500" />
                  </div>
                )}

                {callStatus === "connected" && (
                  <div className="mt-8 flex space-x-4">
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {isMuted ? <MicOff /> : <Mic />}
                    </button>
                    {activeMode === "video" && (
                      <button onClick={() => setIsVideoMuted(!isVideoMuted)} className={`p-4 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <VideoOff />
                      </button>
                    )}
                    <button onClick={() => hangUpCall(true)} className="p-4 rounded-full bg-red-600 hover:bg-red-500 shadow-lg">
                      <PhoneOff />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
