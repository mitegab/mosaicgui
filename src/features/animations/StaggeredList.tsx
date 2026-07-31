import { motion, Variants } from 'framer-motion';
import { PropsWithChildren, ReactNode } from 'react';

interface StaggeredListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  staggerMs?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const directionOffset = {
  up:    { y: 16, x: 0 },
  down:  { y: -16, x: 0 },
  left:  { x: 16, y: 0 },
  right: { x: -16, y: 0 },
};

export function StaggeredList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  staggerMs = 50,
  direction = 'up',
}: StaggeredListProps<T>) {
  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerMs / 1000,
      },
    },
  };

  const offset = directionOffset[direction];
  const item: Variants = {
    hidden: { opacity: 0, ...offset },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 28 },
    },
  };

  return (
    <motion.ul
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {items.map((data, index) => (
        <motion.li key={keyExtractor(data, index)} variants={item}>
          {renderItem(data, index)}
        </motion.li>
      ))}
    </motion.ul>
  );
}

/** Simpler wrapper for generic children stagger */
export function StaggeredChildren({
  children,
  staggerMs = 60,
  className,
}: PropsWithChildren<{ staggerMs?: number; className?: string }>) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: staggerMs / 1000 } } }}
    >
      {children}
    </motion.div>
  );
}

/** Individual item wrapper for use inside StaggeredChildren */
export function StaggerItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } },
      }}
    >
      {children}
    </motion.div>
  );
}
