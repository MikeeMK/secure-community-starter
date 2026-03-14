import React from 'react';
import { renderRichText } from '../lib/markdown';

export function RichContent({
  value,
  className,
  style,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        color: 'var(--text)',
        fontSize: 15,
        lineHeight: 1.75,
        wordBreak: 'break-word',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: renderRichText(value) }}
    />
  );
}
