import React from 'react';

export const MedievalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21V11h8v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8v4H8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M6 4h12v3H6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h1v-1h-1zm3 0h1v-1h-1zm3 0h1v-1h-1z" />
    </svg>
);