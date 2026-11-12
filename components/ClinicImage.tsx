'use client'

import { useEffect, useRef, useState } from 'react'

export interface ClinicImageProps {
  src?: string
  alt: string
  /** The parent must reserve the image area, e.g. h-[168px] or h-[340px]. */
  className?: string
  priority?: boolean
  isLogo?: boolean
}

function ImageAsset({ src, alt, priority, isLogo }: Pick<ClinicImageProps, 'alt' | 'priority' | 'isLogo'> & { src: string }) {
  const [mode, setMode] = useState<'loading' | 'contain' | 'cover' | 'error'>('loading')
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Cached images may finish before React attaches the load handler.
    const image = imageRef.current
    if (image?.complete) {
      setMode(image.naturalWidth > 0 ? displayMode(image, isLogo) : 'error')
    }
  }, [isLogo])

  return (
    <>
      {mode === 'error' && <ImageFallback />}
      {mode !== 'error' && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={event => setMode(displayMode(event.currentTarget, isLogo))}
          onError={() => setMode('error')}
          className={mode === 'cover' ? 'absolute inset-0 w-full h-full object-cover' : 'relative object-contain'}
          style={mode === 'cover' ? undefined : { maxWidth: '80%', maxHeight: '75%', width: 'auto', height: 'auto' }}
        />
      )}
    </>
  )
}

function displayMode(image: HTMLImageElement, isLogo = false): 'cover' | 'contain' | 'error' {
  const { naturalWidth: width, naturalHeight: height } = image
  if (width < 64 || height < 24) return 'error'
  const ratio = width / height
  // Small assets, wordmarks, portraits, and product squares remain bounded.
  return !isLogo && width >= 640 && height >= 300 && ratio >= 1.2 && ratio <= 2.4 ? 'cover' : 'contain'
}

function ImageFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
      <span className="text-xs">Clinic photo unavailable</span>
    </div>
  )
}

export default function ClinicImage({ src, alt, className = '', priority = false, isLogo = false }: ClinicImageProps) {
  // A scraped conversion pixel was found among clinic assets. Never request it as imagery.
  const imageSrc = src && !/^https?:\/\/([^/]+\.)?sitescout\.com(?:[/:]|$)/i.test(src) ? src : undefined
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-stone/10 ${className}`}>
      {imageSrc ? <ImageAsset key={imageSrc} src={imageSrc} alt={alt} priority={priority} isLogo={isLogo} /> : <ImageFallback />}
    </div>
  )
}
