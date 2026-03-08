import React from 'react';
import kawaiiHappy from '@/assets/stickers/kawaii-happy.png';
import kawaiiSad from '@/assets/stickers/kawaii-sad.png';
import kawaiiAnxious from '@/assets/stickers/kawaii-anxious.png';
import kawaiiCalm from '@/assets/stickers/kawaii-calm.png';
import kawaiiGrateful from '@/assets/stickers/kawaii-grateful.png';
import kawaiiAngry from '@/assets/stickers/kawaii-angry.png';
import kawaiiLove from '@/assets/stickers/kawaii-love.png';
import kawaiiSleepy from '@/assets/stickers/kawaii-sleepy.png';

interface KawaiiStickerProps {
  size?: number;
  src: string;
  className?: string;
}

const KawaiiImg = ({ size = 32, src, className }: KawaiiStickerProps) => (
  <img src={src} alt="" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />
);

export const KAWAII_STICKERS = {
  kawaii: {
    name: 'Kawaii Moods',
    stickers: [
      { id: 'kawaii-happy', component: KawaiiImg, props: { src: kawaiiHappy } },
      { id: 'kawaii-sad', component: KawaiiImg, props: { src: kawaiiSad } },
      { id: 'kawaii-anxious', component: KawaiiImg, props: { src: kawaiiAnxious } },
      { id: 'kawaii-calm', component: KawaiiImg, props: { src: kawaiiCalm } },
      { id: 'kawaii-grateful', component: KawaiiImg, props: { src: kawaiiGrateful } },
      { id: 'kawaii-angry', component: KawaiiImg, props: { src: kawaiiAngry } },
      { id: 'kawaii-love', component: KawaiiImg, props: { src: kawaiiLove } },
      { id: 'kawaii-sleepy', component: KawaiiImg, props: { src: kawaiiSleepy } },
    ]
  }
};
