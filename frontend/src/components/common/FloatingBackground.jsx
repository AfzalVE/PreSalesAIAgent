import { motion } from 'framer-motion';

export default function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-tr from-[#fafcff] via-[#f7f9fc] to-[#f4f7f6]">
      {/* Dynamic light grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f6_1px,transparent_1px),linear-gradient(to_bottom,#eef2f6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

      {/* Floating Mintlify-like Gradient Blobs */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] right-[10%] w-[45rem] h-[45rem] rounded-full bg-gradient-to-br from-[#00CD80]/8 to-[#3754db]/3 blur-[120px] transform-gpu will-change-transform"
      />

      <motion.div
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 20, -40, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-[-10%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-[#3754db]/5 via-[#25c974]/3 to-[#00cd80]/6 blur-[100px] transform-gpu will-change-transform"
      />

      {/* Floating Node Elements (Vector Architecture Lines) */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        {/* Animated connecting line 1 */}
        <motion.path
          d="M -50 150 C 300 20, 400 350, 700 200 C 1000 50, 1200 400, 1600 300"
          fill="none"
          stroke="url(#gradient-line)"
          strokeWidth="1.5"
          initial={{ strokeDasharray: "1000", strokeDashoffset: "1000" }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        {/* Animated connecting line 2 */}
        <motion.path
          d="M 100 800 C 400 650, 600 900, 900 700 C 1200 500, 1300 850, 1700 750"
          fill="none"
          stroke="url(#gradient-line-2)"
          strokeWidth="1.2"
          initial={{ strokeDasharray: "1000", strokeDashoffset: "1000" }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        <defs>
          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00CD80" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#3754db" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#25c974" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="gradient-line-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3754db" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#00CD80" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3754db" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Floating circles on path intersections */}
        <motion.circle cx="350" cy="200" r="4" fill="#00CD80" className="animate-pulse" />
        <motion.circle cx="850" cy="180" r="3" fill="#3754db" className="animate-pulse-subtle" />
        <motion.circle cx="500" cy="720" r="5" fill="#25c974" className="animate-pulse" />
        <motion.circle cx="1100" cy="620" r="3.5" fill="#00cd80" className="animate-pulse-subtle" />
      </svg>
    </div>
  );
}
