import { motion } from 'framer-motion';
import { Calendar, Compass, Layers, CheckSquare, Sparkles, Rocket } from 'lucide-react';

export default function TimelineRoadmap({ timeline }) {
  // Parse timeline weeks
  const weeks = parseInt(timeline, 10) || 12;

  const milestones = [
    { title: "Kickoff & Wireframes", duration: `Week 1-${Math.round(weeks * 0.15)}`, desc: "Define structural specifications, product goals.", icon: Compass },
    { title: "Visual Style System", duration: `Week ${Math.round(weeks * 0.15) + 1}-${Math.round(weeks * 0.3)}`, desc: "Wise typography, interactive interfaces designed.", icon: Layers },
    { title: "Core Architecture Dev", duration: `Week ${Math.round(weeks * 0.3) + 1}-${Math.round(weeks * 0.65)}`, desc: "Full stack engineering, integrations.", icon: CheckSquare },
    { title: "AI Modules Tuning", duration: `Week ${Math.round(weeks * 0.65) + 1}-${Math.round(weeks * 0.8)}`, desc: "Custom embedding vectors set up.", icon: Sparkles },
    { title: "QA Release Handover", duration: `Week ${Math.round(weeks * 0.8) + 1}-${weeks}`, desc: "System checks, cloud launch.", icon: Rocket }
  ];

  return (
    <div className="w-full bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Project Milestone Schedule</h4>
          <span className="text-sm font-semibold text-neutral-800">Total duration: {timeline}</span>
        </div>
        <Calendar size={18} className="text-brand-500" />
      </div>

      <div className="relative pl-6 border-l border-neutral-100 space-y-6">
        {milestones.map((milestone, index) => {
          const Icon = milestone.icon;
          return (
            <motion.div 
              key={milestone.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline marker */}
              <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h5 className="text-sm font-semibold text-neutral-800 flex items-center">
                    <Icon size={14} className="mr-1.5 text-neutral-500" />
                    {milestone.title}
                  </h5>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded mt-1 sm:mt-0 w-max">
                    {milestone.duration}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{milestone.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
