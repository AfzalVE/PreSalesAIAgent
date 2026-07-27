import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Phone, Video, Send, User, Search, Loader2 
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { apiFetch } from "../../utils/api";

export default function EmployeeChats() {
  const { user } = useAppStore();
  
  // Extract the proper UUID. The token contains the UUID as 'sub', which we store as user.id/user.employee_id?
  // Wait, the new login router returns `employee_id` which we can store, or we fallback to an ID.
  // Actually, we can get the profile first or just use user.emailOrPhone as a fallback code if needed.
  // But wait, the admin login doesn't natively map employee_id to user.id yet unless we updated it. Let's fetch profile.
  
  const [employeeId, setEmployeeId] = useState(null);
  
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  const [callStatus, setCallStatus] = useState("idle"); 
  const [activeMode, setActiveMode] = useState("chat"); // 'chat', 'video', 'call'

  const ws = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // 1. Fetch Profile to get Employee ID (since it's a UUID needed for websockets)
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await apiFetch("/employee/profile/");
        setEmployeeId(profile.id);
      } catch(err) {
        console.error("Failed to fetch employee profile for chat:", err);
      }
    };
    init();
  }, []);

  // 2. Fetch Conversations
  useEffect(() => {
    if (!employeeId) return;
    const fetchConversations = async () => {
      try {
        const res = await apiFetch(`/chats/employee-conversations/${employeeId}`);
        setClients(res);
        if (res.length > 0 && !activeClient) {
          setActiveClient(res[0]);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };
    fetchConversations();
  }, [employeeId]);

  // 3. Setup WebSocket
  useEffect(() => {
    if (!employeeId) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const backendHost = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    
    ws.current = new WebSocket(`${wsProtocol}//${backendHost}/api/v1/chats/ws/${employeeId}`);
    ws.current.onopen = () => console.log("Developer WS Connected");
    
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const senderId = data.sender_id;

      if (data.type === "chat") {
        setChatMessages(prev => [...prev, {
          sender: "client",
          text: data.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else if (data.type === "call_offer") {
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
      hangUpCall(false);
    };
  }, [employeeId]);

  // 4. Fetch Active Client Chat History
  useEffect(() => {
    if (!activeClient || !employeeId) return;
    
    const fetchHistory = async () => {
      try {
        const res = await apiFetch(`/chats/history/${activeClient.client_id}/${employeeId}`);
        setChatMessages(res);
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };
    fetchHistory();
  }, [activeClient, employeeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !activeClient) return;

    const myMsg = {
      sender: "employee",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, myMsg]);
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "chat",
        target_id: activeClient.client_id,
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
      if (event.candidate && ws.current && activeClient) {
        ws.current.send(JSON.stringify({
          type: "ice_candidate",
          target_id: activeClient.client_id,
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
      target_id: clientIdToCall || activeClient?.client_id,
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

  const hangUpCall = (notifyClient = true) => {
    if (notifyClient && ws.current && activeClient && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "end_call",
        target_id: activeClient.client_id
      }));
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    setCallStatus("idle");
    setActiveMode("chat");
    setRemoteStream(null);
  };

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl border border-neutral-200 shadow-xl shadow-primary/5 overflow-hidden flex">
      {/* Left Pane: Chat List */}
      <div className="w-80 border-r border-neutral-100 flex flex-col bg-neutral-50/30">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="font-headline-md text-lg font-bold text-navy-accent">Client Messages</h2>
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {clients.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-500 font-medium">
              No client conversations yet.
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.client_id}
                onClick={() => setActiveClient(client)}
                className={`w-full text-left p-4 border-b border-neutral-100 transition-colors ${
                  activeClient?.client_id === client.client_id 
                    ? "bg-primary/5 border-l-4 border-l-primary" 
                    : "hover:bg-white border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-navy-accent text-sm truncate">{client.client_name}</span>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">{client.last_message_time}</span>
                </div>
                <p className="text-[11px] text-neutral-500 font-medium mb-1 truncate">{client.client_email}</p>
                <p className="text-xs text-neutral-500 truncate">{client.last_message}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-1 flex flex-col relative">
        {activeClient ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-neutral-100 px-6 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {activeClient.client_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-headline-md font-bold text-navy-accent leading-none mb-1">{activeClient.client_name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-neutral-500">{activeClient.client_email}</p>
                    <span className="text-neutral-300">•</span>
                    <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                    </p>
                  </div>
                </div>
              </div>

              {activeMode !== "chat" && (
                <button
                  onClick={() => hangUpCall(true)}
                  className="px-4 py-1.5 bg-red-100 text-red-600 text-sm font-semibold rounded-full hover:bg-red-200 transition-colors"
                >
                  End Call
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#fafafa]">
              {/* Chat View */}
              {activeMode === "chat" && (
                <div className="absolute inset-0 flex flex-col p-6 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
                      No messages yet. Send a message to start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isEmployee = msg.sender === "employee";
                      return (
                        <div key={i} className={`flex flex-col mb-4 max-w-[70%] ${isEmployee ? 'self-end' : 'self-start'}`}>
                          <div className={`p-3 rounded-2xl text-sm ${
                            isEmployee 
                              ? "bg-primary text-white rounded-tr-sm shadow-sm" 
                              : "bg-white border border-neutral-200 text-navy-accent rounded-tl-sm shadow-sm"
                          }`}>
                            {msg.text}
                          </div>
                          <span className={`text-[10px] text-neutral-400 mt-1 ${isEmployee ? 'text-right' : 'text-left'}`}>
                            {msg.time}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Video/Call View */}
              {(activeMode === "video" || activeMode === "call") && (
                <div className="absolute inset-0 bg-neutral-900 flex flex-col">
                  {activeMode === "video" ? (
                    <div className="flex-1 relative">
                      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 right-6 w-48 h-32 bg-black rounded-xl overflow-hidden border-2 border-white shadow-2xl">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30 animate-pulse">
                        <User size={64} className="text-primary" />
                      </div>
                      <audio ref={remoteAudioRef} autoPlay />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            {activeMode === "chat" && (
              <div className="p-4 bg-white border-t border-neutral-100 flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:bg-white focus:border-primary transition-colors text-sm"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark hover:shadow-lg transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/30">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a client to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
