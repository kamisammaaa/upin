'use client';

import React, { useMemo } from 'react';
import { renderMathInHtml } from '@/app/utils/mathRenderer';

interface MathRendererProps {
  content: string | null | undefined;
  className?: string;
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    return renderMathInHtml(content);
  }, [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
