'use client';

import React from 'react';

type ExpandableBioProps = {
  text: string;
  lineClamp?: number;
  style?: React.CSSProperties;
};

export function ExpandableBio({
  text,
  lineClamp = 3,
  style,
}: ExpandableBioProps) {
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);

  React.useEffect(() => {
    if (expanded) return undefined;

    const element = textRef.current;
    if (!element) return undefined;

    const checkOverflow = () => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    };

    checkOverflow();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(checkOverflow) : null;
    resizeObserver?.observe(element);
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [expanded, text, lineClamp]);

  return (
    <div>
      <p
        ref={textRef}
        style={{
          ...style,
          margin: 0,
          ...(expanded
            ? null
            : {
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: lineClamp,
              }),
        }}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          style={{
            marginTop: 10,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--primary)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {expanded ? 'Replier' : 'Lire plus'}
        </button>
      )}
    </div>
  );
}
