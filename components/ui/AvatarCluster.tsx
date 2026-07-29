import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarClusterProps {
  /** Array of avatar URLs or initials */
  avatars: { src?: string; initials?: string; alt?: string }[];
  /** Max avatars to show before +N badge */
  max?: number;
  /** Size of each avatar */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-7 h-7 text-[10px]', overlap: '-ml-2' },
  md: { container: 'w-8 h-8 text-xs', overlap: '-ml-2.5' },
  lg: { container: 'w-10 h-10 text-sm', overlap: '-ml-3' },
};

const bgColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

export default function AvatarCluster({ avatars, max = 4, size = 'md', className }: AvatarClusterProps) {
  const s = sizeMap[size];
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full border-2 border-white flex items-center justify-center font-semibold shrink-0 overflow-hidden",
            s.container,
            index > 0 && s.overlap,
            !avatar.src && bgColors[index % bgColors.length]
          )}
          title={avatar.alt}
        >
          {avatar.src ? (
            <img src={avatar.src} alt={avatar.alt || ''} className="w-full h-full object-cover" />
          ) : (
            <span>{avatar.initials || '?'}</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full border-2 border-white flex items-center justify-center font-semibold bg-gray-100 text-gray-600 shrink-0",
            s.container,
            s.overlap
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
