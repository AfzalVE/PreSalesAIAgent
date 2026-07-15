import { motion } from 'framer-motion';

export default function AnimatedCard({ children, className = '', onClick, delay = 0, hoverOffset = -4 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={onClick || hoverOffset ? { 
        y: hoverOffset,
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.06)",
        borderColor: "rgba(0, 205, 128, 0.3)"
      } : {}}
      onClick={onClick}
      className={`bg-white/80 border border-neutral-200/80 rounded-2xl p-6 shadow-soft transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
