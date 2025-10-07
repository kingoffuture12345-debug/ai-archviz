import React from 'react';

export const TextureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v12H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3v12m-4.5-4.5h12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 10.5h3v7.5h-7.5v-3" />
    </svg>
);
