import { motion } from 'framer-motion';
import AnimatedCard from './AnimatedCard';

export default function MetricCard({ title, value, subtext, icon: Icon, colorClass = "text-brand-500", delay = 0 }) {
  return (
    <AnimatedCard delay={delay} className="flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-neutral-500 tracking-tight">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl bg-neutral-100 ${colorClass}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="mt-4">
        <motion.span 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-3xl font-bold font-display tracking-tight text-neutral-900 block"
        >
          {value}
        </motion.span>
        {subtext && <p className="text-xs text-neutral-400 mt-1 font-medium">{subtext}</p>}
      </div>
    </AnimatedCard>
  );
}
