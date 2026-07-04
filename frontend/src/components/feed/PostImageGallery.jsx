import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '../../lib/cn'

function FeedImage({ src, alt, className, onClick, index = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        'feed-image-frame group relative w-full bg-transparent rounded-2xl lg:rounded-3xl',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl lg:rounded-3xl',
        'animate-feed-image-in',
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          'feed-image-img w-full h-full object-contain max-h-[min(75vh,800px)] mx-auto block',
          'rounded-2xl lg:rounded-3xl bg-transparent',
          'ring-1 ring-white/10 group-hover:ring-primary/25 transition-[ring-color] duration-200'
        )}
      />
      <span className="absolute inset-0 rounded-2xl lg:rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <span className="p-2 rounded-full bg-black/35 backdrop-blur-sm">
          <ZoomIn className="w-4 h-4 text-white" />
        </span>
      </span>
    </button>
  )
}

export default function PostImageGallery({ images, postId }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!images?.length) return null

  const open = (idx) => setLightboxIndex(idx)
  const close = () => setLightboxIndex(null)
  const prev = () => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  const next = () => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0))

  const count = images.length

  return (
    <>
      <div className="mt-4 w-full feed-gallery">
        {count === 1 && (
          <FeedImage
            src={images[0]}
            alt={`Post ${postId} image`}
            onClick={() => open(0)}
            index={0}
            className="min-h-[200px] lg:min-h-[280px]"
          />
        )}

        {count === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
            {images.map((src, idx) => (
              <FeedImage
                key={idx}
                src={src}
                alt={`Post image ${idx + 1}`}
                onClick={() => open(idx)}
                index={idx}
                className="min-h-[200px] lg:min-h-[320px]"
              />
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 sm:grid-rows-2">
            <FeedImage
              src={images[0]}
              alt="Post image 1"
              onClick={() => open(0)}
              index={0}
              className="sm:row-span-2 min-h-[220px] lg:min-h-[400px]"
            />
            <FeedImage
              src={images[1]}
              alt="Post image 2"
              onClick={() => open(1)}
              index={1}
              className="min-h-[160px] lg:min-h-[195px]"
            />
            <FeedImage
              src={images[2]}
              alt="Post image 3"
              onClick={() => open(2)}
              index={2}
              className="min-h-[160px] lg:min-h-[195px]"
            />
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            {images.slice(0, 4).map((src, idx) => (
              <div key={idx} className="relative">
                <FeedImage
                  src={src}
                  alt={`Post image ${idx + 1}`}
                  onClick={() => open(idx)}
                  index={idx}
                  className="min-h-[160px] lg:min-h-[240px]"
                />
                {idx === 3 && count > 4 && (
                  <button
                    type="button"
                    onClick={() => open(3)}
                    className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-black/40 flex items-center justify-center text-white text-xl font-bold"
                  >
                    +{count - 4}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm animate-feed-lightbox-in"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-sm text-white/70 tabular-nums">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-0 px-4 pb-4 relative">
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 lg:left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <img
              key={lightboxIndex}
              src={images[lightboxIndex]}
              alt={`Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-2xl bg-transparent animate-feed-image-in"
            />
            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-2 lg:right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
