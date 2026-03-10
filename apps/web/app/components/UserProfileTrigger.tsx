'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

type UserProfileTriggerProps = {
  userId: string;
  displayName: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  stopPropagation?: boolean;
};

export function UserProfileTrigger({
  userId,
  displayName,
  children,
  style,
  className,
  stopPropagation = false,
}: UserProfileTriggerProps) {
  const router = useRouter();

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={['user-trigger', className].filter(Boolean).join(' ')}
        onClick={(event) => {
          if (stopPropagation) {
            event.preventDefault();
            event.stopPropagation();
          }
          router.push(`/profil/${userId}`);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (stopPropagation) {
            event.stopPropagation();
          }
          router.push(`/profil/${userId}`);
        }}
        style={{
          background: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'inline-flex',
          alignItems: 'center',
          ...style,
        }}
        title={`Voir le profil de ${displayName}`}
      >
        {children ?? displayName}
      </span>
    </>
  );
}
