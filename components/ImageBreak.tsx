'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageBreakProps {
  imageSrc: string
  imageNumber: number
  height?: 'small' | 'medium' | 'large'
  showCaption?: boolean
}

export function ImageBreak({
  imageSrc,
  imageNumber,
  height = 'medium',
  showCaption = false,
}: ImageBreakProps) {
  const [loaded, setLoaded] = useState(false)
  
  const paddedNumber = String(imageNumber).padStart(2, '0')
  const caption = `Untitled ${paddedNumber}`
  
  const heightClasses = {
    small: 'h-48 md:h-64',
    medium: 'h-64 md:h-96',
    large: 'h-96 md:h-[500px]',
  }

  return (
    <figure className="w-full">
      <div className={`relative w-full ${heightClasses[height]} overflow-hidden`}>
        <Image
          src={imageSrc}
          alt={caption}
          fill
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
        />
      </div>
      {showCaption && (
        <figcaption className="gallery-caption text-center py-4">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
