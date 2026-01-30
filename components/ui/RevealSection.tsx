'use client'

import { useRef, ReactNode } from 'react'
import { motion, useInView, Variants } from 'framer-motion'

interface RevealSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: boolean
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  blur?: boolean
  once?: boolean
  amount?: number | 'some' | 'all'
}

const getDirectionOffset = (direction: RevealSectionProps['direction']) => {
  switch (direction) {
    case 'up': return { y: 12 }
    case 'down': return { y: -12 }
    case 'left': return { x: 12 }
    case 'right': return { x: -12 }
    case 'none': return {}
    default: return { y: 12 }
  }
}

export function RevealSection({
  children,
  className = '',
  delay = 0,
  stagger = false,
  staggerDelay = 0.08,
  direction = 'up',
  blur = false,
  once = true,
  amount = 0.2,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, amount })

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger ? staggerDelay : 0,
        delayChildren: delay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...getDirectionOffset(direction),
      ...(blur ? { filter: 'blur(4px)' } : {}),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...getDirectionOffset(direction),
        ...(blur ? { filter: 'blur(8px)' } : {}),
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
      } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

// Child component for staggered reveals
export function RevealItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
