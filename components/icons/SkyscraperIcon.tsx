import React from 'react';

export const SkyscraperIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21v-5.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V21" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 21V3.75a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5V21" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5" />
    </svg>
);