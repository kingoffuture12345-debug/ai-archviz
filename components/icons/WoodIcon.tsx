import React from 'react';

export const WoodIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c3-5 9-5 12 0s3 5 0 5-9-5-12 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12c3-5 9-5 12 0s3 5 0 5" transform="translate(-6)" />
    </svg>
);