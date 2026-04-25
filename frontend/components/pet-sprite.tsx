'use client';



interface PetSpriteProps {
  alt: string;
  src: string;
  maxWidth: number;
  maxHeight: number;
  className?: string;
}

export function PetSprite({
  alt,
  src,
  maxWidth,
  maxHeight,
  className = '',
}: PetSpriteProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: maxWidth,
        height: maxHeight,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
