import React from 'react';
import { StickerProps } from './CanvaSticker';

// Modern 3D-style stickers with advanced graphics
export const GeometricHeart = ({ size = 32, color = "#ff6b9d", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="heartGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor="#c62828" />
      </linearGradient>
      <filter id="heartShadow3d">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
      </filter>
    </defs>
    <path
      d="M24 42L21.35 39.65C13 32.48 7 27.39 7 21C7 16.5 10.5 13 15 13C17.76 13 20.26 14.62 21.5 16.81C22.5 14.81 23.5 14.62 24 16.81C25.24 14.62 27.74 13 30.5 13C35 13 38.5 16.5 38.5 21C38.5 27.39 32.5 32.48 24.15 39.65L24 42Z"
      fill="url(#heartGrad1)"
      filter="url(#heartShadow3d)"
    />
    <path
      d="M24 42L21.35 39.65C13 32.48 7 27.39 7 21C7 16.5 10.5 13 15 13C17.76 13 20.26 14.62 21.5 16.81"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <ellipse cx="18" cy="20" rx="2" ry="1.5" fill="rgba(255,255,255,0.4)" />
  </svg>
);

export const CrystalStar = ({ size = 32, color = "#ffd93d", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="starCrystal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff3e0" />
        <stop offset="30%" stopColor={color} />
        <stop offset="70%" stopColor="#ff8f00" />
        <stop offset="100%" stopColor="#e65100" />
      </linearGradient>
      <filter id="starGlow3d">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#starGlow3d)">
      <path
        d="M24 4L30.18 16.36L44 18.27L34 28.14L36.36 42L24 35.82L11.64 42L14 28.14L4 18.27L17.82 16.36L24 4Z"
        fill="url(#starCrystal)"
        stroke="#ff8f00"
        strokeWidth="1"
      />
      <path
        d="M24 4L30.18 16.36L44 18.27L34 28.14"
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="20" r="2" fill="rgba(255,255,255,0.8)"/>
      <polygon points="24,12 26,18 24,16 22,18" fill="rgba(255,255,255,0.5)"/>
    </g>
  </svg>
);

export const GlowingMoon = ({ size = 32, className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <radialGradient id="moonGlow">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="40%" stopColor="#e3f2fd" />
        <stop offset="80%" stopColor="#90caf9" />
        <stop offset="100%" stopColor="#42a5f5" />
      </radialGradient>
      <filter id="moonHalo">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle
      cx="24"
      cy="24"
      r="16"
      fill="url(#moonGlow)"
      filter="url(#moonHalo)"
      stroke="#64b5f6"
      strokeWidth="0.5"
    />
    <circle cx="20" cy="18" r="2" fill="#b0bec5" fillOpacity="0.4"/>
    <circle cx="28" cy="22" r="1.5" fill="#b0bec5" fillOpacity="0.3"/>
    <circle cx="22" cy="28" r="3" fill="#b0bec5" fillOpacity="0.2"/>
    <ellipse cx="18" cy="16" rx="1" ry="0.5" fill="rgba(255,255,255,0.8)"/>
  </svg>
);

export const NeonLightning = ({ size = 32, color = "#e91e63", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="30%" stopColor={color} />
        <stop offset="100%" stopColor="#ad1457" />
      </linearGradient>
      <filter id="neonGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feGaussianBlur stdDeviation="4" result="bigBlur"/>
        <feMerge> 
          <feMergeNode in="bigBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      d="M20 4L28 20L22 20L28 44L20 28L26 28L20 4Z"
      fill="url(#lightningGrad)"
      filter="url(#neonGlow)"
      stroke={color}
      strokeWidth="0.5"
    />
    <path
      d="M20 4L28 20L22 20"
      fill="none"
      stroke="rgba(255,255,255,0.8)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const GradientBubble = ({ size = 32, color = "#74b9ff", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <radialGradient id="bubbleGrad">
        <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
        <stop offset="30%" stopColor={color} />
        <stop offset="100%" stopColor="#0984e3" />
      </radialGradient>
      <filter id="bubbleGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.3"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <ellipse
      cx="24"
      cy="20"
      rx="16"
      ry="14"
      fill="url(#bubbleGrad)"
      filter="url(#bubbleGlow)"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1"
    />
    <path
      d="M14 32L18 40L24 36L14 32Z"
      fill={color}
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="0.5"
    />
    <ellipse cx="20" cy="16" rx="3" ry="2" fill="rgba(255,255,255,0.6)"/>
    <circle cx="28" cy="18" r="1.5" fill="rgba(255,255,255,0.4)"/>
  </svg>
);

export const GlassMorphicHeart = ({ size = 32, className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <defs>
      <linearGradient id="glassHeart" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="50%" stopColor="rgba(255,105,180,0.3)" />
        <stop offset="100%" stopColor="rgba(255,20,147,0.4)" />
      </linearGradient>
      <filter id="glassBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5"/>
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(255,105,180,0.3)"/>
      </filter>
    </defs>
    <path
      d="M24 42L21.35 39.65C13 32.48 7 27.39 7 21C7 16.5 10.5 13 15 13C17.76 13 20.26 14.62 21.5 16.81C22.74 14.62 25.24 13 28 13C32.5 13 36 16.5 36 21C36 27.39 30 32.48 21.65 39.65L24 42Z"
      fill="url(#glassHeart)"
      filter="url(#glassBlur)"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.5"
    />
    <path
      d="M24 42L21.35 39.65C13 32.48 7 27.39 7 21C7 16.5 10.5 13 15 13C17.76 13 20.26 14.62 21.5 16.81"
      fill="none"
      stroke="rgba(255,255,255,0.8)"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <ellipse cx="18" cy="20" rx="2" ry="1" fill="rgba(255,255,255,0.6)" />
  </svg>
);

export const MODERN_STICKERS = {
  premium: {
    name: 'Premium',
    stickers: [
      { id: 'geo-heart-pink', component: GeometricHeart, props: { color: '#ff6b9d' } },
      { id: 'geo-heart-red', component: GeometricHeart, props: { color: '#e74c3c' } },
      { id: 'crystal-star', component: CrystalStar, props: { color: '#ffd93d' } },
      { id: 'glowing-moon', component: GlowingMoon, props: {} },
      { id: 'neon-lightning', component: NeonLightning, props: { color: '#e91e63' } },
      { id: 'glass-heart', component: GlassMorphicHeart, props: {} },
    ]
  },
  bubbles: {
    name: 'Speech Bubbles',
    stickers: [
      { id: 'gradient-bubble-blue', component: GradientBubble, props: { color: '#74b9ff' } },
      { id: 'gradient-bubble-green', component: GradientBubble, props: { color: '#00b894' } },
      { id: 'gradient-bubble-purple', component: GradientBubble, props: { color: '#a29bfe' } },
      { id: 'gradient-bubble-orange', component: GradientBubble, props: { color: '#fd79a8' } },
    ]
  }
};