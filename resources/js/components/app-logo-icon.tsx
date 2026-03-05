import type { SVGAttributes } from 'react';

/** Tushar Electronics logo – "TE" monogram. */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
        >
            {/* T: top bar and stem */}
            <path d="M4 8h14v2H11v22H9V10H4V8z" />
            {/* E: vertical and three horizontal bars */}
            <path d="M22 8h14v2H24v8h10v2H24v10h12v2H22V8z" />
        </svg>
    );
}
