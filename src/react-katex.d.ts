declare module 'react-katex' {
  import * as React from 'react';

  export const InlineMath: React.ComponentType<{ math: string; className?: string; }>; 
  export const BlockMath: React.ComponentType<{ math: string; className?: string; }>;
}
