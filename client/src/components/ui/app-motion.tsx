import { motion, type HTMLMotionProps, type Variants } from 'motion/react'

const sharedTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: sharedTransition,
  },
}

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

type AnimatedDivProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'variants'>

export function AnimatedPage({ children, ...props }: AnimatedDivProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={itemVariants} {...props}>
      {children}
    </motion.div>
  )
}

export function AnimatedReveal({ children, ...props }: AnimatedDivProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={itemVariants} {...props}>
      {children}
    </motion.div>
  )
}

export function AnimatedStagger({ children, ...props }: AnimatedDivProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={staggerVariants} {...props}>
      {children}
    </motion.div>
  )
}

export function AnimatedStaggerItem({ children, ...props }: AnimatedDivProps) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  )
}

type AnimatedProgressFillProps = {
  progress: number
  className?: string
}

export function AnimatedProgressFill({ progress, className }: AnimatedProgressFillProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <motion.div
      className={className}
      initial={{ width: 0 }}
      animate={{ width: `${clampedProgress}%` }}
      transition={{ duration: 0.55, ease: sharedTransition.ease }}
    />
  )
}
