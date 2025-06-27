interface CardImageProps {
  src?: string
  alt?: string
  width?: number
  height?: number
}

export function CardImage({ src, alt = "Logo", width = 48, height = 48 }: CardImageProps) {
  return (
    <div className="flex justify-center">
      {src ? (
        <img src={src || "/placeholder.svg"} alt={alt} width={width} height={height} className="object-contain" />
      ) : (
        <div
          className="bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/30"
          style={{ width, height }}
        >
          <span className="text-white/60 text-xs">Logo</span>
        </div>
      )}
    </div>
  )
}
