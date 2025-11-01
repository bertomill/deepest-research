'use client';

import { motion, Variants } from 'motion/react';
import { cn } from '@/lib/utils';

interface GradualSpacingTextProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  className?: string;
}

export function GradualSpacingText({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  className,
}: GradualSpacingTextProps) {
  const characters = text.split('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delayMultiple,
      },
    },
  };

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      x: -20,
      letterSpacing: '-0.5em',
    },
    visible: {
      opacity: 1,
      x: 0,
      letterSpacing: '0em',
      transition: {
        duration,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('flex', className)}
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={childVariants}
          className={char === ' ' ? 'w-2' : ''}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
}
