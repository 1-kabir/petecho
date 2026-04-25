'use client';

import { useState } from 'react';

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
  const [size, setSize] = useState({ width: 48, height: 48 });

  const scale = Math.max(
    1,
    Math.floor(Math.min(maxWidth / size.width, maxHeight / size.height))
  );

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
        onLoad={(event) => {
          const image = event.currentTarget;
          if (image.naturalWidth && image.naturalHeight) {
            setSize({
              width: image.naturalWidth,
              height: image.naturalHeight,
            });
          }
        }}
        style={{
          width: size.width * scale,
          height: size.height * scale,
          imageRendering: 'pixelated',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
