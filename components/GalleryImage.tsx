'use client'

import Image from 'next/image'
import { useState } from 'react'

interface GalleryImageProps {
  src: string
  imageNumber: number
  className?: string
  priority?: boolean
  sizes?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto'
  showCaption?: boolean
  fill?: boolean
}

export function GalleryImage({
  src,
  imageNumber,
  className = '',
  priority = false,
  sizes = '100vw',
  aspectRatio = 'auto',
  showCaption = true,
  fill = false,
}: GalleryImageProps) {
  const [loaded, setLoaded] = useState(false)
  
  const paddedNumber = String(imageNumber).padStart(2, '0')
  const caption = `Untitled ${paddedNumber}`
  
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: '',
  }

  return (
    <figure className={`${className}`}>
      <div className={`relative overflow-hidden bg-neutral-100 ${aspectClasses[aspectRatio]}`}>
        <Image
          src={src}
          alt={caption}
          fill={fill || aspectRatio !== 'auto'}
          width={aspectRatio === 'auto' && !fill ? 1200 : undefined}
          height={aspectRatio === 'auto' && !fill ? 800 : undefined}
          sizes={sizes}
          priority={priority}
          className={`object-cover transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
        />
      </div>
      {showCaption && (
        <figcaption className="gallery-caption text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
