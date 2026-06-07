/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface AudioVisualizerProps {
  isRecording: boolean;
  color: string;
}

export default function AudioVisualizer({ isRecording, color = "teal" }: AudioVisualizerProps) {
  // 9 equalizer bars with staggered animations
  const bars = Array.from({ length: 9 });

  const getThemeColors = () => {
    switch (color) {
      case "blue":
        return "bg-blue-400 shadow-blue-500/50";
      case "amber":
        return "bg-amber-400 shadow-amber-500/50";
      case "teal":
      default:
        return "bg-teal-400 shadow-teal-500/50";
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 h-14 px-4 py-2" id="speech-waveform-layout">
      {bars.map((_, index) => {
        // Create variations of speed and height ratio
        const delay = index * 0.1;
        const duration = 0.6 + (index % 3) * 0.2;

        return (
          <motion.div
            key={index}
            className={`w-1 rounded-full shadow-[0_0_8px_0_rgba(0,0,0,0.1)] ${getThemeColors()}`}
            style={{ height: "6px" }}
            animate={
              isRecording
                ? {
                    height: ["8px", "44px", "14px", "40px", "8px"],
                  }
                : {
                    height: "6px",
                  }
            }
            transition={
              isRecording
                ? {
                    duration: duration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: delay,
                  }
                : {
                    duration: 0.3,
                  }
            }
          />
        );
      })}
    </div>
  );
}
