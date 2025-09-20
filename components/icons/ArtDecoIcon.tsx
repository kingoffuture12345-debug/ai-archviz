import React from 'react';

export const ArtDecoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V15M12 15L6 3h12L12 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3L2 9h4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 3l4 6h-4" />
    </svg>
);