import React from 'react';

export const MoveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M9 3v18m-4 4 4-4-4-4m14 8 4-4-4-4" />
    </svg>
);