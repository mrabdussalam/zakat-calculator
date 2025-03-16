'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'div';
}

export function SectionTitle({
  children,
  className,
  as: Component = 'h2'
}: SectionTitleProps) {
  return (
    <Component
      className={cn("section-title", className)}
      style={{ fontFamily: "var(--font-anglecia), serif", fontWeight: 400, fontStyle: 'italic' }}
    >
      {children}
    </Component>
  );
}

export function PageTitle({
  children,
  className,
  as: Component = 'h1'
}: SectionTitleProps) {
  return (
    <Component
      className={cn("page-title", className)}
      style={{ fontFamily: "var(--font-anglecia), serif", fontWeight: 400, fontStyle: 'italic' }}
    >
      {children}
    </Component>
  );
} 