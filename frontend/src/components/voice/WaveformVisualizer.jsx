import { motion } from 'framer-motion';

export default function WaveformVisualizer({ isRecording }) {
  const bars = Array.from({ length: 24 });

  return (
    <div className="flex items-center justify-center space-x-1.5 h-16 w-full">
      {bars.map((_, i) => {
        // Deterministic pseudo-random values based on index to ensure component purity
        const duration = 0.5 + ((i * 7) % 8) * 0.1;
        const delay = ((i * 13) % 10) * 0.04;
        const animatedHeight = 12 + ((i * 23) % 30);
        
        return (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-brand-400 via-brand-500 to-wise-blue"
            initial={{ height: 6 }}
            animate={isRecording ? {
              height: [6, animatedHeight, 6],
            } : {
              height: 6
            }}
            transition={{
              duration: isRecording ? duration : 0.3,
              repeat: isRecording ? Infinity : 0,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: isRecording ? delay : 0
            }}
          />
        );
      })}
    </div>
  );
}

