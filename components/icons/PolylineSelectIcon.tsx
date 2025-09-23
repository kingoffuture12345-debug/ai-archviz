import React from 'react';

export const PolylineSelectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l4-10 6 2 4-8" />
        <circle cx="4.5" cy="19.5" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="14.5" cy="11.5" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="18.5" cy="3.5" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
);