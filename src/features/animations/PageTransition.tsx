import { AnimatePresence, motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28, duration: 0.3 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

interface PageTransitionProps {
  pageKey: string;
}

export function PageTransition({ pageKey, children }: PropsWithChildren<PageTransitionProps>) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className="h-full w-full"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Wrap a section that should fade-in on mount.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: PropsWithChildren<{ delay?: number; className?: string }>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A value that counts up from 0 to the given number.
 */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}
