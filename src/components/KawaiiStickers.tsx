import React from 'react';

// Corner decoration stickers (washi tape style)
import cornerFloralPink from '@/assets/stickers/corner-floral-pink.png';
import cornerStarsMint from '@/assets/stickers/corner-stars-mint.png';
import cornerButterflyPurple from '@/assets/stickers/corner-butterfly-purple.png';
import cornerSunflowerPeach from '@/assets/stickers/corner-sunflower-peach.png';
import cornerRainbowBlue from '@/assets/stickers/corner-rainbow-blue.png';
import cornerRosesRed from '@/assets/stickers/corner-roses-red.png';
import cornerForestGreen from '@/assets/stickers/corner-forest-green.png';
import cornerSparkleGold from '@/assets/stickers/corner-sparkle-gold.png';

// Full body animals
import kawaiiCatFull from '@/assets/stickers/kawaii-cat-full.png';
import kawaiiBearFull from '@/assets/stickers/kawaii-bear-full.png';
import kawaiiBunnyFull from '@/assets/stickers/kawaii-bunny-full.png';
import kawaiiPuppyFull from '@/assets/stickers/kawaii-puppy-full.png';
import kawaiiFoxFull from '@/assets/stickers/kawaii-fox-full.png';
import kawaiiPandaFull from '@/assets/stickers/kawaii-panda-full.png';
import kawaiiPenguinFull from '@/assets/stickers/kawaii-penguin-full.png';
import kawaiiOwlFull from '@/assets/stickers/kawaii-owl-full.png';

// Mood stickers
import kawaiiMoodHappy from '@/assets/stickers/kawaii-mood-happy.png';
import kawaiiMoodSad from '@/assets/stickers/kawaii-mood-sad.png';
import kawaiiMoodCalm from '@/assets/stickers/kawaii-mood-calm.png';
import kawaiiMoodLove from '@/assets/stickers/kawaii-mood-love.png';
import kawaiiMoodSleepy from '@/assets/stickers/kawaii-mood-sleepy.png';
import kawaiiMoodAnxious from '@/assets/stickers/kawaii-mood-anxious.png';
import kawaiiMoodGrateful from '@/assets/stickers/kawaii-mood-grateful.png';
import kawaiiMoodAngry from '@/assets/stickers/kawaii-mood-angry.png';

// Nature (existing)
import kawaiiSakura from '@/assets/stickers/kawaii-sakura.png';
import kawaiiSunflower from '@/assets/stickers/kawaii-sunflower.png';
import kawaiiRose from '@/assets/stickers/kawaii-rose.png';
import kawaiiTulip from '@/assets/stickers/kawaii-tulip.png';
import kawaiiDaisy from '@/assets/stickers/kawaii-daisy.png';
import kawaiiBouquet from '@/assets/stickers/kawaii-bouquet.png';
import kawaiiCactus from '@/assets/stickers/kawaii-cactus.png';
import kawaiiRainbow from '@/assets/stickers/kawaii-rainbow.png';
import kawaiiStar from '@/assets/stickers/kawaii-star.png';
import kawaiiMoon from '@/assets/stickers/kawaii-moon.png';

// Objects (existing)
import kawaiiCoffee from '@/assets/stickers/kawaii-coffee.png';
import kawaiiBook from '@/assets/stickers/kawaii-book.png';

export interface StickerDef {
  id: string;
  component: React.FC<{ size?: number; className?: string }>;
  props: Record<string, any>;
}

interface KawaiiStickerProps {
  size?: number;
  src: string;
  className?: string;
}

const KawaiiImg = ({ size = 32, src, className }: KawaiiStickerProps) => (
  <img src={src} alt="" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />
);

export const KAWAII_STICKERS: Record<string, { name: string; stickers: StickerDef[] }> = {
  animals: {
    name: 'Cute Animals',
    stickers: [
      { id: 'kawaii-cat', component: KawaiiImg, props: { src: kawaiiCatFull } },
      { id: 'kawaii-bear', component: KawaiiImg, props: { src: kawaiiBearFull } },
      { id: 'kawaii-bunny', component: KawaiiImg, props: { src: kawaiiBunnyFull } },
      { id: 'kawaii-puppy', component: KawaiiImg, props: { src: kawaiiPuppyFull } },
      { id: 'kawaii-fox', component: KawaiiImg, props: { src: kawaiiFoxFull } },
      { id: 'kawaii-panda', component: KawaiiImg, props: { src: kawaiiPandaFull } },
      { id: 'kawaii-penguin', component: KawaiiImg, props: { src: kawaiiPenguinFull } },
      { id: 'kawaii-owl', component: KawaiiImg, props: { src: kawaiiOwlFull } },
    ]
  },
  moods: {
    name: 'Moods',
    stickers: [
      { id: 'kawaii-happy', component: KawaiiImg, props: { src: kawaiiMoodHappy } },
      { id: 'kawaii-sad', component: KawaiiImg, props: { src: kawaiiMoodSad } },
      { id: 'kawaii-calm', component: KawaiiImg, props: { src: kawaiiMoodCalm } },
      { id: 'kawaii-love', component: KawaiiImg, props: { src: kawaiiMoodLove } },
      { id: 'kawaii-sleepy', component: KawaiiImg, props: { src: kawaiiMoodSleepy } },
      { id: 'kawaii-anxious', component: KawaiiImg, props: { src: kawaiiMoodAnxious } },
      { id: 'kawaii-grateful', component: KawaiiImg, props: { src: kawaiiMoodGrateful } },
      { id: 'kawaii-angry', component: KawaiiImg, props: { src: kawaiiMoodAngry } },
    ]
  },
  flowers: {
    name: 'Flowers',
    stickers: [
      { id: 'kawaii-sakura', component: KawaiiImg, props: { src: kawaiiSakura } },
      { id: 'kawaii-sunflower', component: KawaiiImg, props: { src: kawaiiSunflower } },
      { id: 'kawaii-rose', component: KawaiiImg, props: { src: kawaiiRose } },
      { id: 'kawaii-tulip', component: KawaiiImg, props: { src: kawaiiTulip } },
      { id: 'kawaii-daisy', component: KawaiiImg, props: { src: kawaiiDaisy } },
      { id: 'kawaii-bouquet', component: KawaiiImg, props: { src: kawaiiBouquet } },
      { id: 'kawaii-cactus', component: KawaiiImg, props: { src: kawaiiCactus } },
    ]
  },
  objects: {
    name: 'Nature & Objects',
    stickers: [
      { id: 'kawaii-rainbow', component: KawaiiImg, props: { src: kawaiiRainbow } },
      { id: 'kawaii-star', component: KawaiiImg, props: { src: kawaiiStar } },
      { id: 'kawaii-moon', component: KawaiiImg, props: { src: kawaiiMoon } },
      { id: 'kawaii-coffee', component: KawaiiImg, props: { src: kawaiiCoffee } },
      { id: 'kawaii-book', component: KawaiiImg, props: { src: kawaiiBook } },
    ]
  },
};

/** Flat list of all stickers for lookups */
export const ALL_STICKERS = Object.values(KAWAII_STICKERS).flatMap(cat => cat.stickers);
