type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className={`avatar avatar-${size}`} aria-label={name}>
      {initial}
    </div>
  );
}
