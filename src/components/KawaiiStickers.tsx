import React from 'react';
// Mood stickers
import kawaiiHappy from '@/assets/stickers/kawaii-happy.png';
import kawaiiSad from '@/assets/stickers/kawaii-sad.png';
import kawaiiAnxious from '@/assets/stickers/kawaii-anxious.png';
import kawaiiCalm from '@/assets/stickers/kawaii-calm.png';
import kawaiiGrateful from '@/assets/stickers/kawaii-grateful.png';
import kawaiiAngry from '@/assets/stickers/kawaii-angry.png';
import kawaiiLove from '@/assets/stickers/kawaii-love.png';
import kawaiiSleepy from '@/assets/stickers/kawaii-sleepy.png';
// Animal face stickers
import kawaiiCat from '@/assets/stickers/kawaii-cat.png';
import kawaiiBear from '@/assets/stickers/kawaii-bear.png';
import kawaiiBunny from '@/assets/stickers/kawaii-bunny.png';
import kawaiiPanda from '@/assets/stickers/kawaii-panda.png';
import kawaiiFox from '@/assets/stickers/kawaii-fox.png';
import kawaiiPenguin from '@/assets/stickers/kawaii-penguin.png';
import kawaiiPuppy from '@/assets/stickers/kawaii-puppy.png';
import kawaiiOwl from '@/assets/stickers/kawaii-owl.png';
// Cat activities
import kawaiiCatSleeping from '@/assets/stickers/kawaii-cat-sleeping.png';
import kawaiiCatEating from '@/assets/stickers/kawaii-cat-eating.png';
import kawaiiCatPlaying from '@/assets/stickers/kawaii-cat-playing.png';
import kawaiiCatSad from '@/assets/stickers/kawaii-cat-sad.png';
// Bear activities
import kawaiiBearSleeping from '@/assets/stickers/kawaii-bear-sleeping.png';
import kawaiiBearEating from '@/assets/stickers/kawaii-bear-eating.png';
import kawaiiBearPlaying from '@/assets/stickers/kawaii-bear-playing.png';
import kawaiiBearSad from '@/assets/stickers/kawaii-bear-sad.png';
// Bunny activities
import kawaiiBunnyEating from '@/assets/stickers/kawaii-bunny-eating.png';
import kawaiiBunnyPlaying from '@/assets/stickers/kawaii-bunny-playing.png';
import kawaiiBunnySad from '@/assets/stickers/kawaii-bunny-sad.png';
// Puppy activities
import kawaiiPuppySleeping from '@/assets/stickers/kawaii-puppy-sleeping.png';
import kawaiiPuppyEating from '@/assets/stickers/kawaii-puppy-eating.png';
import kawaiiPuppyPlaying from '@/assets/stickers/kawaii-puppy-playing.png';
import kawaiiPuppySad from '@/assets/stickers/kawaii-puppy-sad.png';
// Flowers
import kawaiiSakura from '@/assets/stickers/kawaii-sakura.png';
import kawaiiSunflower from '@/assets/stickers/kawaii-sunflower.png';
import kawaiiRose from '@/assets/stickers/kawaii-rose.png';
import kawaiiTulip from '@/assets/stickers/kawaii-tulip.png';
import kawaiiDaisy from '@/assets/stickers/kawaii-daisy.png';
import kawaiiBouquet from '@/assets/stickers/kawaii-bouquet.png';
// Cute objects
import kawaiiRainbow from '@/assets/stickers/kawaii-rainbow.png';
import kawaiiStar from '@/assets/stickers/kawaii-star.png';
import kawaiiMoon from '@/assets/stickers/kawaii-moon.png';
import kawaiiCoffee from '@/assets/stickers/kawaii-coffee.png';
import kawaiiBook from '@/assets/stickers/kawaii-book.png';
import kawaiiCactus from '@/assets/stickers/kawaii-cactus.png';

interface KawaiiStickerProps {
  size?: number;
  src: string;
  className?: string;
}

const KawaiiImg = ({ size = 32, src, className }: KawaiiStickerProps) => (
  <img src={src} alt="" width={size} height={size} className={className} style={{ objectFit: 'contain' }} />
);

export const KAWAII_STICKERS = {
  kawaiiFlowers: {
    name: 'Kawaii Flowers',
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
  kawaiiObjects: {
    name: 'Kawaii Objects',
    stickers: [
      { id: 'kawaii-rainbow', component: KawaiiImg, props: { src: kawaiiRainbow } },
      { id: 'kawaii-star', component: KawaiiImg, props: { src: kawaiiStar } },
      { id: 'kawaii-moon', component: KawaiiImg, props: { src: kawaiiMoon } },
      { id: 'kawaii-coffee', component: KawaiiImg, props: { src: kawaiiCoffee } },
      { id: 'kawaii-book', component: KawaiiImg, props: { src: kawaiiBook } },
    ]
  },
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
  },
  kawaiiCatLife: {
    name: 'Cat Life',
    stickers: [
      { id: 'kawaii-cat-sleeping', component: KawaiiImg, props: { src: kawaiiCatSleeping } },
      { id: 'kawaii-cat-eating', component: KawaiiImg, props: { src: kawaiiCatEating } },
      { id: 'kawaii-cat-playing', component: KawaiiImg, props: { src: kawaiiCatPlaying } },
      { id: 'kawaii-cat-sad', component: KawaiiImg, props: { src: kawaiiCatSad } },
    ]
  },
  kawaiiBearLife: {
    name: 'Bear Life',
    stickers: [
      { id: 'kawaii-bear-sleeping', component: KawaiiImg, props: { src: kawaiiBearSleeping } },
      { id: 'kawaii-bear-eating', component: KawaiiImg, props: { src: kawaiiBearEating } },
      { id: 'kawaii-bear-playing', component: KawaiiImg, props: { src: kawaiiBearPlaying } },
      { id: 'kawaii-bear-sad', component: KawaiiImg, props: { src: kawaiiBearSad } },
    ]
  },
  kawaiiBunnyLife: {
    name: 'Bunny Life',
    stickers: [
      { id: 'kawaii-bunny-eating', component: KawaiiImg, props: { src: kawaiiBunnyEating } },
      { id: 'kawaii-bunny-playing', component: KawaiiImg, props: { src: kawaiiBunnyPlaying } },
      { id: 'kawaii-bunny-sad', component: KawaiiImg, props: { src: kawaiiBunnySad } },
    ]
  },
  kawaiiPuppyLife: {
    name: 'Puppy Life',
    stickers: [
      { id: 'kawaii-puppy-sleeping', component: KawaiiImg, props: { src: kawaiiPuppySleeping } },
      { id: 'kawaii-puppy-eating', component: KawaiiImg, props: { src: kawaiiPuppyEating } },
      { id: 'kawaii-puppy-playing', component: KawaiiImg, props: { src: kawaiiPuppyPlaying } },
      { id: 'kawaii-puppy-sad', component: KawaiiImg, props: { src: kawaiiPuppySad } },
    ]
  },
};
