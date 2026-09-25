// A chalk sketch for the Learn index: a light bulb (an idea) above a small stack of books. Static.
export default function LearnArt({ className }) {
  return (
    <svg className={className} viewBox="0 0 420 420" fill="none" aria-hidden="true">
      <defs>
        {/* Rough the lines up and speckle them so they read as chalk on a board */}
        <filter id="la-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="1" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.1 1.55" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </defs>

      <g filter="url(#la-chalk)" stroke="#eef3fb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".92">
        {/* light bulb */}
        <path d="M210 62c-38 0-66 29-66 64 0 24 12 40 26 54 9 9 13 18 13 30v12h54v-12c0-12 4-21 13-30 14-14 26-30 26-54 0-35-28-64-66-64z" />
        <path d="M186 234h48M188 246h44M194 258h32" />
        <path d="M202 270h16" />
        <path d="M194 222c0-26 4-46 16-60 12 14 16 34 16 60" strokeWidth="2.2" opacity=".75" />
        <path d="M186 112c4-14 14-24 26-28" strokeWidth="2.4" opacity=".7" />

        {/* rays */}
        <g strokeWidth="2.8">
          <path d="M210 22v18" />
          <path d="M126 58l12 12" />
          <path d="M294 58l-12 12" />
          <path d="M96 128h18" />
          <path d="M306 128h18" />
          <path d="M122 196l12-8" />
          <path d="M298 196l-12-8" />
        </g>

        {/* stack of books */}
        <path d="M110 312h200l-6 26H104z" />
        <path d="M110 312l-6 26" />
        <path d="M290 312v26M298 312v26" strokeWidth="2" />
        <path d="M126 324h70" strokeWidth="2" opacity=".7" />

        <path d="M96 338h226v30H96z" />
        <path d="M112 338v30M120 338v30" strokeWidth="2" />
        <path d="M150 353h96" strokeWidth="2" opacity=".7" />

        <path d="M122 286l176-6 4 30-176 6z" />
        <path d="M280 281l2 30" strokeWidth="2" />
        <path d="M140 299l86-3" strokeWidth="2" opacity=".7" />

        {/* ground line */}
        <path d="M70 372c90 3 190 3 282-1" strokeWidth="2.2" opacity=".6" />
      </g>

      {/* a little chalk colour */}
      <g filter="url(#la-chalk)" strokeLinecap="round" opacity=".75">
        <path d="M100 344h220M102 352h216M100 360h220" stroke="#72ede5" strokeWidth="2.4" opacity=".6" />
        <path d="M116 318h186M114 326h186" stroke="#fd79a8" strokeWidth="2.4" opacity=".6" />
        <path d="M128 292l168-6M128 300l168-6" stroke="#a29bfe" strokeWidth="2.4" opacity=".65" />
        <circle cx="210" cy="128" r="46" stroke="#f9ca24" strokeWidth="2.4" strokeDasharray="4 10" opacity=".75" />
      </g>
    </svg>
  );
}
