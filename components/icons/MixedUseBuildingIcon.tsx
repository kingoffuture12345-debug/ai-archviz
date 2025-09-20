import React from 'react';

export const MixedUseBuildingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {/* Storefront part */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21V11.25a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25V21" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
        {/* Residential part */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9V3.75a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5V9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3" />
    </svg>
);
