'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  href?: string
  children: React.ReactNode
  className?: string
}

type ButtonProps = ButtonBaseProps & Omit<HTMLMotionProps<'button'>, keyof ButtonBaseProps>

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-stone-800 text-white
    hover:bg-stone-900
    focus-visible:ring-2 focus-visible:ring-stone-800/50 focus-visible:ring-offset-2
  `,
  secondary: `
    bg-white text-stone-700 border border-stone-300
    hover:border-stone-400 hover:bg-stone-50
    focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2
  `,
  ghost: `
    text-stone-600
    hover:text-stone-800
  `,
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'lg', loading, href, children, className = '', disabled, ...props }, ref) => {
    const baseClasses = `
      relative inline-flex items-center justify-center
      font-normal tracking-wide
      transition-colors duration-300 ease-out
      focus:outline-none
      disabled:opacity-40 disabled:cursor-not-allowed
    `
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

    const motionProps = {
      whileHover: disabled ? {} : { y: -2, boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.1)' },
      whileTap: disabled ? {} : { y: 0, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
    }

    const content = (
      <>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
      </>
    )

    if (href) {
      return (
        <motion.div {...motionProps}>
          <Link href={href} className={classes}>
            {content}
          </Link>
        </motion.div>
      )
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...motionProps}
        {...props}
      >
        {content}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
