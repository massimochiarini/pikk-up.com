'use client'

import { GalleryImage } from './GalleryImage'

interface GalleryGridProps {
  images: { src: string; number: number }[]
  columns?: 2 | 3 | 4
  gap?: 'small' | 'medium' | 'large'
  aspectRatio?: 'square' | 'portrait' | 'landscape'
}

export function GalleryGrid({
  images,
  columns = 3,
  gap = 'medium',
  aspectRatio = 'square',
}: GalleryGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }
  
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6 md:gap-8',
    large: 'gap-8 md:gap-12',
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
      {images.map((image) => (
        <GalleryImage
          key={image.number}
          src={image.src}
          imageNumber={image.number}
          aspectRatio={aspectRatio}
          sizes={`(max-width: 768px) 100vw, ${100 / columns}vw`}
        />
      ))}
    </div>
  )
}
