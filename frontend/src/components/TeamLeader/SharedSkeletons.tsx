import React from 'react';

/**
 * A standard, generic inline skeleton bar with a configurable height and width.
 */
export const SkeletonBar: React.FC<{ h?: string; w?: string; className?: string; style?: React.CSSProperties }> = ({ 
  h = "h-4", 
  w = "w-full", 
  className = "",
  style
}) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse ${className}`} style={style} />
);

/**
 * A generic pulsing box used for larger tiles/widgets.
 */
export const SkeletonBox: React.FC<{ h?: string; w?: string; className?: string; style?: React.CSSProperties }> = ({ 
  h = "h-full", 
  w = "w-full", 
  className = "",
  style
}) => (
  <div className={`${w} ${h} bg-slate-100 animate-pulse border border-slate-100 rounded-xl ${className}`} style={style} />
);
