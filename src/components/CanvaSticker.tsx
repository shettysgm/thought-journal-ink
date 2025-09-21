import React from 'react';

export interface StickerProps {
  size?: number;
  color?: string;
  className?: string;
}

// Decorative Elements
export const HeartSticker = ({ size = 32, color = "#ff6b9d", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
  </svg>
);

export const StarSticker = ({ size = 32, color = "#ffd93d", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
  </svg>
);

export const SunSticker = ({ size = 32, color = "#ffb347", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="5" fill={color} stroke="#fff" strokeWidth="1"/>
    <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CloudSticker = ({ size = 32, color = "#87ceeb", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M18.5 12c1.38 0 2.5 1.12 2.5 2.5S19.88 17 18.5 17H6c-2.21 0-4-1.79-4-4s1.79-4 4-4c.34 0 .68.04 1 .11C8.04 7.19 9.94 6 12 6c3.31 0 6 2.69 6 6 0 .35-.03.69-.08 1.02.18-.01.36-.02.58-.02z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
  </svg>
);

export const RainbowSticker = ({ size = 32, className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8s8 3.59 8 8h2c0-5.52-4.48-10-10-10z" fill="#ff6b6b"/>
    <path d="M12 4C7.58 4 4 7.58 4 12h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-4.42-3.58-8-8-8z" fill="#ffa500"/>
    <path d="M12 6C8.69 6 6 8.69 6 12h2c0-2.21 1.79-4 4-4s4 1.79 4 4h2c0-3.31-2.69-6-6-6z" fill="#ffff00"/>
    <path d="M12 8c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2h2c0-2.21-1.79-4-4-4z" fill="#90ee90"/>
  </svg>
);

export const FlowerSticker = ({ size = 32, color = "#ff69b4", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="3" fill="#ffd93d"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(0 12 12)"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(120 12 12)"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(180 12 12)"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(240 12 12)"/>
    <ellipse cx="12" cy="8" rx="2" ry="4" fill={color} transform="rotate(300 12 12)"/>
  </svg>
);

export const ButterflySticker = ({ size = 32, className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M12 2c0 2-1 3-2 4s-2 2-2 4 1 3 2 4 2 2 2 4" stroke="#8b4513" strokeWidth="1.5" fill="none"/>
    <ellipse cx="9" cy="8" rx="3" ry="4" fill="#ff6b9d" opacity="0.8"/>
    <ellipse cx="15" cy="8" rx="3" ry="4" fill="#ff6b9d" opacity="0.8"/>
    <ellipse cx="9" cy="16" rx="2.5" ry="3" fill="#87ceeb" opacity="0.8"/>
    <ellipse cx="15" cy="16" rx="2.5" ry="3" fill="#87ceeb" opacity="0.8"/>
    <circle cx="12" cy="6" r="1" fill="#8b4513"/>
  </svg>
);

export const ArrowSticker = ({ size = 32, color = "#6c5ce7", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M7 17l9.5-9.5M17 17V7H7"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const BubbleSticker = ({ size = 32, color = "#74b9ff", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
  </svg>
);

export const CrownSticker = ({ size = 32, color = "#ffd93d", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M5 16L3 7l5.5 5L12 4l3.5 8L21 7l-2 9H5z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
    <circle cx="7" cy="19" r="1" fill={color}/>
    <circle cx="12" cy="19" r="1" fill={color}/>
    <circle cx="17" cy="19" r="1" fill={color}/>
  </svg>
);

export const DiamondSticker = ({ size = 32, color = "#e17055", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M6 9l6-7 6 7-6 13-6-13z"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
    <path
      d="M6 9h12M9 2l3 7M15 2l-3 7"
      stroke="#fff"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

export const ThumbsUpSticker = ({ size = 32, color = "#00b894", className }: StickerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
      fill={color}
      stroke="#fff"
      strokeWidth="1"
    />
  </svg>
);

export const CANVA_STICKERS = {
  hearts: {
    name: 'Hearts & Love',
    stickers: [
      { id: 'heart-pink', component: HeartSticker, props: { color: '#ff6b9d' } },
      { id: 'heart-red', component: HeartSticker, props: { color: '#e74c3c' } },
      { id: 'heart-purple', component: HeartSticker, props: { color: '#9b59b6' } },
    ]
  },
  nature: {
    name: 'Nature & Weather',
    stickers: [
      { id: 'sun', component: SunSticker, props: { color: '#f39c12' } },
      { id: 'cloud', component: CloudSticker, props: { color: '#87ceeb' } },
      { id: 'rainbow', component: RainbowSticker, props: {} },
      { id: 'flower-pink', component: FlowerSticker, props: { color: '#ff69b4' } },
      { id: 'flower-purple', component: FlowerSticker, props: { color: '#9b59b6' } },
      { id: 'butterfly', component: ButterflySticker, props: {} },
    ]
  },
  decorative: {
    name: 'Decorative',
    stickers: [
      { id: 'star-yellow', component: StarSticker, props: { color: '#ffd93d' } },
      { id: 'star-pink', component: StarSticker, props: { color: '#ff6b9d' } },
      { id: 'crown', component: CrownSticker, props: { color: '#ffd93d' } },
      { id: 'diamond', component: DiamondSticker, props: { color: '#e17055' } },
    ]
  },
  communication: {
    name: 'Communication',
    stickers: [
      { id: 'bubble-blue', component: BubbleSticker, props: { color: '#74b9ff' } },
      { id: 'bubble-green', component: BubbleSticker, props: { color: '#00b894' } },
      { id: 'arrow-purple', component: ArrowSticker, props: { color: '#6c5ce7' } },
      { id: 'arrow-orange', component: ArrowSticker, props: { color: '#e17055' } },
      { id: 'thumbs-up', component: ThumbsUpSticker, props: { color: '#00b894' } },
    ]
  }
};