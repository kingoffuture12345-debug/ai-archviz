import React from 'react';

export const CozyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 8v10h1a2 2 0 002-2V10a2 2 0 00-2-2h-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 5s.5-1.5 2-1.5 2 1.5 2 1.5m-2.5 2s.5-1.5 2-1.5 2 1.5 2 1.5" />
    </svg>
);