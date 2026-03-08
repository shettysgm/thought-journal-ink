import React from 'react';
import kawaiiHappy from '@/assets/stickers/kawaii-happy.png';
import kawaiiSad from '@/assets/stickers/kawaii-sad.png';
import kawaiiAnxious from '@/assets/stickers/kawaii-anxious.png';
import kawaiiCalm from '@/assets/stickers/kawaii-calm.png';
import kawaiiGrateful from '@/assets/stickers/kawaii-grateful.png';
import kawaiiAngry from '@/assets/stickers/kawaii-angry.png';
import kawaiiLove from '@/assets/stickers/kawaii-love.png';
import kawaiiSleepy from '@/assets/stickers/kawaii-sleepy.png';
import kawaiiCat from '@/assets/stickers/kawaii-cat.png';
import kawaiiBear from '@/assets/stickers/kawaii-bear.png';
import kawaiiBunny from '@/assets/stickers/kawaii-bunny.png';
import kawaiiPanda from '@/assets/stickers/kawaii-panda.png';
import kawaiiFox from '@/assets/stickers/kawaii-fox.png';
import kawaiiPenguin from '@/assets/stickers/kawaii-penguin.png';
import kawaiiPuppy from '@/assets/stickers/kawaii-puppy.png';
import kawaiiOwl from '@/assets/stickers/kawaii-owl.png';

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
  },
  kawaiiAnimals: {
    name: 'Kawaii Animals',
    stickers: [
      { id: 'kawaii-cat', component: KawaiiImg, props: { src: kawaiiCat } },
      { id: 'kawaii-bear', component: KawaiiImg, props: { src: kawaiiBear } },
      { id: 'kawaii-bunny', component: KawaiiImg, props: { src: kawaiiBunny } },
      { id: 'kawaii-panda', component: KawaiiImg, props: { src: kawaiiPanda } },
      { id: 'kawaii-fox', component: KawaiiImg, props: { src: kawaiiFox } },
      { id: 'kawaii-penguin', component: KawaiiImg, props: { src: kawaiiPenguin } },
      { id: 'kawaii-puppy', component: KawaiiImg, props: { src: kawaiiPuppy } },
      { id: 'kawaii-owl', component: KawaiiImg, props: { src: kawaiiOwl } },
    ]
  }
};
