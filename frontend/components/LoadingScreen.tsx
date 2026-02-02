import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F3F0] to-[#E8E6E3]">
      <div className="text-center">
        {/* Animated Circle */}
        <motion.div
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#8B8680] opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Loading Text */}
        <motion.h2
          className="text-2xl font-semibold text-[#2D2D2D] mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          あなたの洞察を構造化しています...
        </motion.h2>
        
        <motion.p
          className="text-[#6B6560]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          パーソナライズされたMarkdownドキュメントを作成中
        </motion.p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#8B8680]"
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}