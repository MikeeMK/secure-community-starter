import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  src?: string | null;
}

const sizePx: Record<AvatarSize, number> = {
  sm: 30,
  md: 42,
  lg: 68,
  xl: 96,
  xxl: 260,
};

export function Avatar({ name, size = 'md', src }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className={`avatar avatar-${size}`} aria-label={name}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes={`${sizePx[size]}px`}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        initial
      )}
    </div>
  );
}
