import { motion } from 'framer-motion';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';
import SkillTag from '../common/SkillTag';

export default function ProposalCard({ title, subtitle, budget, timeline, techStack, description, risks, scalability, onSelect, active = false }) {
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.06)" }}
      className={`relative bg-white border rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between h-full ${
        active 
          ? 'border-brand-500 shadow-md ring-1 ring-brand-500/20' 
          : 'border-neutral-200 shadow-soft hover:border-neutral-300'
      }`}
    >
      {active && (
        <span className="absolute top-4 right-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-500 text-white">
          <Sparkles size={12} className="mr-1.5 animate-pulse" />
          Recommended Path
        </span>
      )}

      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold font-display text-neutral-900">{title}</h3>
          <p className="text-xs font-medium text-neutral-500 mt-1">{subtitle}</p>
        </div>

        {/* Dynamic Pricing and Duration */}
        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-neutral-100 mb-6">
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Estimated Budget</label>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">${budget.toLocaleString()}</div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Timeline</label>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">{timeline}</div>
          </div>
        </div>

        {/* Feature/Description summary */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">Architecture & Tech</label>
            <div className="flex flex-wrap gap-1">
              {techStack.slice(0, 4).map((tech) => (
                <SkillTag key={tech} skill={tech} />
              ))}
              {techStack.length > 4 && (
                <span className="text-[10px] text-neutral-400 font-medium px-2 py-0.5 bg-neutral-100 rounded-full flex items-center">
                  +{techStack.length - 4} more
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">Scope Focus</label>
            <p className="text-xs text-neutral-600 leading-relaxed">{description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Scale Vector</span>
              <span className="text-neutral-800 font-medium flex items-center">
                <ShieldCheck size={12} className="mr-1 text-brand-500 flex-shrink-0" />
                {scalability}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Risk Factor</span>
              <span className="text-neutral-800 font-medium flex items-center">
                <Info size={12} className="mr-1 text-amber-500 flex-shrink-0" />
                {risks}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onSelect}
          className={`w-full py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
            active
              ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-100'
              : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
          }`}
        >
          {active ? 'Selected Strategy' : 'Select Strategy'}
        </button>
      </div>
    </motion.div>
  );
}
