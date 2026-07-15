import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export default function ArchitectureDiagram({ stage }) {
  const { projectData } = useAppStore();
  
  // Resolve tech stack values dynamically or fallback to default
  const stack = (Array.isArray(projectData.techStack) && projectData.techStack.length > 0)
    ? projectData.techStack
    : ["React", "Node.js", "PostgreSQL", "OpenAI API"];

  const frontendTech = stack[0] || "React";
  const backendTech = stack[1] || "Node.js";
  const databaseTech = stack[2] || "PostgreSQL";
  const auxiliaryTech = stack[3] || "OpenAI API";

  return (
    <div className="w-full bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between overflow-hidden">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Technical Blueprint Layer</h4>
        <p className="text-sm font-medium text-neutral-800">
          {stage === 'mvp' && `Simplified high-speed stack: ${frontendTech} App pointing directly to single ${backendTech} service.`}
          {stage === 'growth' && `Structured cluster: Custom API gateways, core ${backendTech} workers, and semantic ${auxiliaryTech} memory.`}
          {stage === 'enterprise' && `Federated network: Load balancers, caching layers, ${backendTech} event streams, and distributed nodes.`}
        </p>
      </div>

      <div className="relative h-64 mt-6 flex items-center justify-center bg-neutral-50/50 rounded-xl border border-neutral-100 overflow-hidden">
        {/* Responsive viewport for SVG */}
        <svg className="w-full h-full p-4" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          
          {/* Defs for gradients & markers */}
          <defs>
            <linearGradient id="svg-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00CD80" />
              <stop offset="100%" stopColor="#25c974" />
            </linearGradient>
            <linearGradient id="svg-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3754db" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="svg-grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* SVG FLOW PATHS */}
          
          {/* Base client to API paths (Always Visible) */}
          <path d="M 90 120 L 190 120" stroke="#E4E4E7" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* CONDITIONAL FLOW PATHS */}
          {stage !== 'mvp' && (
            <>
              {/* API to Worker 2 path */}
              <path d="M 230 120 L 310 60" stroke="#E4E4E7" strokeWidth="2" strokeDasharray="4 4" />
              {/* API to AI Worker path */}
              <path d="M 230 120 L 310 180" stroke="#E4E4E7" strokeWidth="2" strokeDasharray="4 4" />
              {/* Worker 1 to DB path */}
              <path d="M 390 120 L 470 100" stroke="#E4E4E7" strokeWidth="2" />
              {/* Worker 2 to Cache path */}
              <path d="M 390 60 L 470 50" stroke="#E4E4E7" strokeWidth="2" />
              {/* AI Worker to VectorDB path */}
              <path d="M 390 180 L 470 190" stroke="#E4E4E7" strokeWidth="2" />
            </>
          )}

          {/* MVP direct path */}
          {stage === 'mvp' && (
            <>
              <path d="M 230 120 L 330 120" stroke="#E4E4E7" strokeWidth="2" />
              <path d="M 390 120 L 490 120" stroke="#E4E4E7" strokeWidth="2" />
            </>
          )}

          {/* ENTERPRISE Load Balancers and event streams */}
          {stage === 'enterprise' && (
            <>
              <path d="M 350 30 Q 350 200 470 120" stroke="#3754db" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M 390 60 L 470 190" stroke="#E4E4E7" strokeWidth="1" strokeDasharray="3 3" />
            </>
          )}

          {/* NODES */}
          
          {/* 1. Client App (React SPA) - Always Present */}
          <g transform="translate(30, 90)">
            <rect width="60" height="60" rx="10" fill="white" stroke="#1E2022" strokeWidth="1.5" className="shadow-sm" />
            <text x="30" y="32" fontSize="9" fontWeight="600" fill="#1E2022" textAnchor="middle">Client App</text>
            <text x="30" y="44" fontSize="8" fill="#71717A" textAnchor="middle">{frontendTech}</text>
          </g>

          {/* 2. API / Server Layer */}
          <g transform="translate(170, 90)">
            <rect width="60" height="60" rx="10" fill="white" stroke="#3754db" strokeWidth="2" />
            <text x="30" y="30" fontSize="9" fontWeight="600" fill="#1d4ed8" textAnchor="middle">
              {stage === 'mvp' ? "Backend App" : "API Gateway"}
            </text>
            <text x="30" y="44" fontSize="8" fill="#71717A" textAnchor="middle">
              {stage === 'mvp' ? backendTech : "Kong / Auth"}
            </text>
          </g>

          {/* MVP Target Database */}
          {stage === 'mvp' && (
            <g transform="translate(470, 90)">
              <rect width="60" height="60" rx="10" fill="white" stroke="#00CD80" strokeWidth="1.5" />
              <text x="30" y="32" fontSize="9" fontWeight="600" fill="#0d9488" textAnchor="middle">Primary DB</text>
              <text x="30" y="44" fontSize="8" fill="#71717A" textAnchor="middle">{databaseTech}</text>
            </g>
          )}

          {/* GROWTH & ENTERPRISE ADVANCED SERVICES */}
          {stage !== 'mvp' && (
            <>
              {/* App Service Node */}
              <g transform="translate(310, 90)">
                <rect width="80" height="40" rx="8" fill="white" stroke="#1E2022" strokeWidth="1.5" />
                <text x="40" y="22" fontSize="9" fontWeight="600" fill="#1E2022" textAnchor="middle">Core Service</text>
                <text x="40" y="33" fontSize="8" fill="#71717A" textAnchor="middle">{backendTech} API</text>
              </g>

              {/* Auxiliary Service Node */}
              <g transform="translate(310, 30)">
                <rect width="80" height="40" rx="8" fill="white" stroke="#1E2022" strokeWidth="1.5" />
                <text x="40" y="22" fontSize="9" fontWeight="600" fill="#1E2022" textAnchor="middle">Notif Engine</text>
                <text x="40" y="33" fontSize="8" fill="#71717A" textAnchor="middle">Websockets</text>
              </g>

              {/* AI Worker Node */}
              <g transform="translate(310, 150)">
                <rect width="80" height="40" rx="8" fill="#f0fdf4" stroke="#00CD80" strokeWidth="2" />
                <text x="40" y="22" fontSize="9" fontWeight="600" fill="#065f46" textAnchor="middle">AI Service</text>
                <text x="40" y="33" fontSize="8" fill="#0d9488" textAnchor="middle">{auxiliaryTech}</text>
              </g>

              {/* Cache Database */}
              <g transform="translate(470, 20)">
                <rect width="60" height="40" rx="8" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="30" y="20" fontSize="9" fontWeight="600" fill="#b45309" textAnchor="middle">Cache</text>
                <text x="30" y="31" fontSize="8" fill="#71717A" textAnchor="middle">Redis</text>
              </g>

              {/* Main SQL Database */}
              <g transform="translate(470, 85)">
                <rect width="60" height="40" rx="8" fill="white" stroke="#00CD80" strokeWidth="1.5" />
                <text x="30" y="20" fontSize="9" fontWeight="600" fill="#047857" textAnchor="middle">Primary DB</text>
                <text x="30" y="31" fontSize="8" fill="#71717A" textAnchor="middle">{databaseTech}</text>
              </g>

              {/* Vector AI Database */}
              <g transform="translate(470, 150)">
                <rect width="60" height="40" rx="8" fill="#f0fdf4" stroke="#00CD80" strokeWidth="1.5" />
                <text x="30" y="20" fontSize="9" fontWeight="600" fill="#047857" textAnchor="middle">Vector DB</text>
                <text x="30" y="31" fontSize="8" fill="#0d9488" textAnchor="middle">Pinecone</text>
              </g>
            </>
          )}

          {/* Dynamic packets flowing along paths (SVG circle animations) */}
          <motion.circle r="3" fill="#3754db"
            animate={stage === 'mvp' ? {
              cx: [90, 190, 330, 490],
              cy: [120, 120, 120, 120]
            } : {
              cx: [90, 190, 310, 470],
              cy: [120, 120, 60, 50]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {stage !== 'mvp' && (
            <motion.circle r="3" fill="#00CD80"
              animate={{
                cx: [90, 190, 310, 470],
                cy: [120, 120, 180, 190]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.5 }}
            />
          )}
        </svg>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-neutral-400 font-medium pt-3 border-t border-neutral-100">
        <span>Node Type: Light Web Cluster</span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          <span className="text-neutral-500 font-bold uppercase">Dynamic Packet Flow</span>
        </span>
      </div>
    </div>
  );
}
