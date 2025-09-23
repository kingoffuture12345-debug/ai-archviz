import React from 'react';

export const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        {/* Left Eye */}
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M2 12 C 5 7, 9 7, 11 12 C 9 17, 5 17, 2 12 Z" 
        />
        {/* Right Eye */}
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M22 12 C 19 7, 15 7, 13 12 C 15 17, 19 17, 22 12 Z" 
        />
    </svg>
);