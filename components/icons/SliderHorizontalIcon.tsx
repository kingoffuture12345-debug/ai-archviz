import React from 'react';

export const SliderHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25 4.5 12l3.75 3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25 19.5 12l-3.75 3.75" />
    </svg>
);
