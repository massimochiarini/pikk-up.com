'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

interface SoftCardProps {
  children: React.ReactNode
  className?: string
  href?: string
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 md:p-10',
}

export const SoftCard = forwardRef<HTMLDivElement, SoftCardProps>(
  ({ children, className = '', href, hover = true, glass = false, padding = 'lg', onClick }, ref) => {
    const baseClasses = `
      relative
      ${glass 
        ? 'bg-white/60 backdrop-blur-glass border-white/40' 
        : 'bg-white border-stone-200/80'
      }
      border shadow-soft-xs
      transition-all duration-400 ease-out
      ${paddingClasses[padding]}
    `

    const hoverMotion = hover ? {
      whileHover: { 
        y: -2,
        borderColor: 'rgba(168, 162, 158, 0.6)',
        boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      },
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    } : {}

    if (href) {
      return (
        <motion.div ref={ref} className={`${baseClasses} ${className}`} {...hoverMotion}>
          <Link href={href} className="block">
            {children}
          </Link>
        </motion.div>
      )
    }

    if (onClick) {
      return (
        <motion.div 
          ref={ref} 
          className={`${baseClasses} cursor-pointer ${className}`} 
          onClick={onClick}
          {...hoverMotion}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <motion.div ref={ref} className={`${baseClasses} ${className}`} {...(hover ? hoverMotion : {})}>
        {children}
      </motion.div>
    )
  }
)

SoftCard.displayName = 'SoftCard'
