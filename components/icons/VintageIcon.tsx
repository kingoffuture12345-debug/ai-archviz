import React from 'react';

export const VintageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 2.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12h3m-9 6v3m-6-9H3m9-6V3" />
    </svg>
);