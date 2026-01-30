'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ReactNode } from 'react'

interface HeroSectionProps {
  imageSrc: string
  imageNumber: number
  children: ReactNode
  overlay?: 'light' | 'dark' | 'none'
  height?: 'screen' | 'large' | 'medium'
  showCaption?: boolean
}

export function HeroSection({
  imageSrc,
  imageNumber,
  children,
  overlay = 'light',
  height = 'large',
  showCaption = false,
}: HeroSectionProps) {
  const [loaded, setLoaded] = useState(false)
  
  const paddedNumber = String(imageNumber).padStart(2, '0')
  const caption = `Untitled ${paddedNumber}`
  
  const heightClasses = {
    screen: 'min-h-screen',
    large: 'min-h-[80vh]',
    medium: 'min-h-[60vh]',
  }
  
  const overlayClasses = {
    light: 'bg-white/60',
    dark: 'bg-charcoal/40',
    none: '',
  }

  return (
    <section className={`relative ${heightClasses[height]} flex items-center justify-center`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={caption}
          fill
          sizes="100vw"
          priority
          className={`object-cover transition-opacity duration-1000 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
        />
        {overlay !== 'none' && (
          <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
      
      {/* Caption */}
      {showCaption && (
        <div className="absolute bottom-6 left-6 z-10">
          <span className={`text-sm tracking-wide ${overlay === 'dark' ? 'text-white/80' : 'text-charcoal/70'}`}>
            {caption}
          </span>
        </div>
      )}
    </section>
  )
}
