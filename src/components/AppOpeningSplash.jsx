import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * AppOpeningSplash
 * 
 * High-fidelity mobile & desktop opening splash animation matching the user's reference video:
 * 1. Initial State: Centered squircle card containing the TAEMRY FLUX logo on a clean canvas.
 * 2. Morph / Splash Entry: Expands smoothly to fill the screen with signature brand color #0c5963.
 * 3. Text Slide Entry: "TAEMRY FLUX" smoothly slides upward into place with elegant typography.
 * 4. Curtain Reveal Exit: The #0c5963 screen slides downward with a curved bottom edge, 
 *    revealing the website underneath in native app style.
 */
export default function AppOpeningSplash({ onComplete }) {
  // Animation phases:
  // 'card' -> initial logo card in center
  // 'expand' -> expands to full screen #0c5963
  // 'textSlide' -> app name slides in below the logo
  // 'exit' -> slides down out of viewport with curved bottom edge
  const [phase, setPhase] = useState('card');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Step 1: Start on 'card' (0ms - 500ms)
    const t1 = setTimeout(() => {
      setPhase('expand');
    }, 550);

    // Step 2: Slide in the text 'TAEMRY FLUX' (expand finishes at ~1100ms)
    const t2 = setTimeout(() => {
      setPhase('textSlide');
    }, 1200);

    // Step 3: Trigger exit slide down (at ~2500ms)
    const t3 = setTimeout(() => {
      setPhase('exit');
    }, 2500);

    // Step 4: Dismiss completely and notify parent
    const t4 = setTimeout(() => {
      setIsDismissed(true);
      if (onComplete) onComplete();
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('exit');
    setTimeout(() => {
      setIsDismissed(true);
      if (onComplete) onComplete();
    }, 600);
  };

  if (isDismissed) return null;

  const isExpanded = phase === 'expand' || phase === 'textSlide' || phase === 'exit';
  const showText = phase === 'textSlide' || phase === 'exit';

  return (
    <AnimatePresence>
      <motion.div
        key="splash-container"
        initial={{ opacity: 1 }}
        animate={
          phase === 'exit'
            ? {
                y: '105%',
                borderTopLeftRadius: '0px',
                borderTopRightRadius: '0px',
                borderBottomLeftRadius: '48px',
                borderBottomRightRadius: '48px',
                transition: {
                  duration: 0.5,
                  ease: [0.65, 0, 0.35, 1], // fluid cubic ease
                },
              }
            : {
                y: '0%',
                borderBottomLeftRadius: '0px',
                borderBottomRightRadius: '0px',
              }
        }
        className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
        onClick={handleSkip}
        style={{
          backgroundColor: isExpanded ? '#0c5963' : '#faf8f5',
          transition: 'background-color 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Curved Bottom Sheet Edge Indicator during Exit - matching video frame 00:07-00:09 */}
        {phase === 'exit' && (
          <div className="absolute -bottom-1 inset-x-0 h-10 bg-[#0c5963] rounded-b-[48px] pointer-events-none shadow-2xl" />
        )}

        {/* Ambient radial glow on brand teal background */}
        <motion.div
          animate={{
            opacity: isExpanded ? 0.45 : 0,
            scale: isExpanded ? 1 : 0.6,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute w-[600px] h-[600px] rounded-full bg-radial from-teal-300/20 via-[#0d6975]/10 to-transparent blur-3xl pointer-events-none"
        />

        {/* Central Logo Box with Splash Entry Animation */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Logo Card Morph */}
          <motion.div
            layout
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={
              isExpanded
                ? {
                    scale: 1,
                    opacity: 1,
                    y: showText ? -16 : 0,
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  }
                : {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    boxShadow: '0 20px 40px -15px rgba(12, 89, 99, 0.35)',
                    backgroundColor: '#ffffff',
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 240,
              damping: 24,
              mass: 0.8,
            }}
            className="flex items-center justify-center rounded-[28px] p-4 transition-colors"
          >
            {/* Logo Emblem inside the card / background */}
            <motion.div
              animate={{
                scale: isExpanded ? 1.15 : 1,
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center"
            >
              <img
                src="/taemry-logo.svg"
                alt="TAEMRY FLUX Logo"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </motion.div>
          </motion.div>

          {/* App Name: Smooth Slide Entry (Matching video frame 00:04-00:06) */}
          <div className="overflow-hidden mt-1 text-center h-16 flex flex-col items-center justify-center">
            <AnimatePresence>
              {showText && (
                <motion.div
                  initial={{ y: 45, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1], // snappy natural deceleration
                  }}
                  className="flex flex-col items-center"
                >
                  <h1 className="font-display font-black text-2xl sm:text-3xl tracking-widest text-white uppercase flex items-center gap-2 drop-shadow-md">
                    <span>TAEMRY</span>
                    <span className="text-teal-200">FLUX</span>
                  </h1>
                  <span className="text-[11px] tracking-[0.3em] font-semibold text-teal-100/80 uppercase mt-0.5">
                    Next-Gen Ad Network
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Subtle quick skip hint at bottom */}
        <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 0.75 : 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex items-center gap-1.5 text-xs text-teal-100/75 font-medium tracking-wider"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-ping" />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
