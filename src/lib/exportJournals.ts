import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllJournalEntries, getJournalEntry } from '@/lib/idb';
import { decryptText } from '@/lib/crypto';
import { useSettings } from '@/store/useSettings';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { CANVA_STICKERS } from '@/components/CanvaSticker';
import { MODERN_STICKERS } from '@/components/ModernStickers';
import { KAWAII_STICKERS } from '@/components/KawaiiStickers';
import ReactDOM from 'react-dom/client';
import React from 'react';

const ALL_STICKERS = [
  ...Object.values(KAWAII_STICKERS).flatMap(cat => cat.stickers),
  ...Object.values(CANVA_STICKERS).flatMap(cat => cat.stickers),
  ...Object.values(MODERN_STICKERS).flatMap(cat => cat.stickers),
];

/** Render a React sticker component into a container and wait for images to load */
async function renderStickerToElement(stickerId: string, size: number): Promise<HTMLElement | null> {
  const stickerDef = ALL_STICKERS.find(s => s.id === stickerId);
  if (!stickerDef) return null;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display: inline-block; width: ${size}px; height: ${size}px;`;

  const root = ReactDOM.createRoot(wrapper);
  root.render(React.createElement(stickerDef.component, { size, ...(stickerDef.props as any) }));

  // Give React time to render + images to load
  await new Promise(r => setTimeout(r, 200));

  // Wait for any images inside to load
  const imgs = wrapper.querySelectorAll('img');
  await Promise.all(Array.from(imgs).map(img =>
    new Promise<void>(resolve => {
      if (img.complete) return resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })
  ));

  return wrapper;
}

/** Build a self-contained HTML card for one entry and capture it as a PNG blob */
async function renderEntryToImage(entry: any, bannerBlobUrl: string | null): Promise<Blob> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 420px; padding: 28px; 
    background: #fff; border-radius: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  `;

  document.body.appendChild(container);

  // Date header
  const dateStr = entry.updatedAt
    ? `${format(new Date(entry.createdAt), 'MMM d, yyyy')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}`
    : format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a');

  const dateEl = document.createElement('div');
  dateEl.style.cssText = 'font-size: 13px; color: #6b7280; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;';
  dateEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${dateStr}</span>`;
  container.appendChild(dateEl);

  // Content row: text on left, sticker/image on right
  const contentRow = document.createElement('div');
  contentRow.style.cssText = 'display: flex; gap: 16px; align-items: flex-start;';

  const leftCol = document.createElement('div');
  leftCol.style.cssText = 'flex: 1; min-width: 0;';

  const rightCol = document.createElement('div');
  rightCol.style.cssText = 'flex-shrink: 0; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;';

  // Banner image or banner sticker on the right
  let hasRightContent = false;
  if (bannerBlobUrl) {
    const img = document.createElement('img');
    img.src = bannerBlobUrl;
    img.crossOrigin = 'anonymous';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 10px;';
    rightCol.appendChild(img);
    hasRightContent = true;
    await new Promise<void>(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      if (img.complete) resolve();
    });
  } else if (entry.bannerSticker && typeof entry.bannerSticker === 'string') {
    const stickerEl = await renderStickerToElement(entry.bannerSticker, 100);
    if (stickerEl) {
      rightCol.appendChild(stickerEl);
      hasRightContent = true;
    }
  }

  // Journal text
  if (entry.text) {
    const textBox = document.createElement('div');
    textBox.style.cssText = `
      background: #f9fafb; border-radius: 10px; padding: 16px;
      margin-bottom: 12px; font-size: 15px; line-height: 1.6;
      color: #1f2937; white-space: pre-wrap; word-break: break-word;
    `;
    textBox.textContent = entry.text;
    leftCol.appendChild(textBox);
  }

  // Mood stickers row with actual sticker images
  if (entry.stickers && entry.stickers.length > 0) {
    const moodRow = document.createElement('div');
    moodRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;';
    const label = document.createElement('span');
    label.style.cssText = 'font-size: 13px; color: #6b7280;';
    label.textContent = 'Mood:';
    moodRow.appendChild(label);

    // Emoji fallback map
    const emojiMap: Record<string, string> = {
      'heart-pink': '💗', 'heart-red': '❤️', 'heart-purple': '💜',
      'sun': '☀️', 'cloud': '☁️', 'rainbow': '🌈',
      'flower-pink': '🌸', 'flower-purple': '🌺', 'butterfly': '🦋',
      'star-yellow': '⭐', 'star-pink': '💖', 'crown': '👑',
      'diamond': '💎', 'bubble-blue': '💬', 'bubble-green': '💭',
      'arrow-purple': '↗️', 'arrow-orange': '➡️', 'thumbs-up': '👍',
    };

    for (const id of entry.stickers) {
      // Try to render actual sticker component
      const stickerEl = await renderStickerToElement(id, 28);
      if (stickerEl) {
        stickerEl.style.cssText += 'background: #f3f4f6; border-radius: 6px; padding: 2px 4px; border: 1px solid #e5e7eb; display: inline-flex; align-items: center; justify-content: center;';
        moodRow.appendChild(stickerEl);
      } else {
        // Fallback to emoji
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size: 18px; background: #f3f4f6; border-radius: 6px; padding: 2px 8px; border: 1px solid #e5e7eb;';
        badge.textContent = emojiMap[id] || id;
        moodRow.appendChild(badge);
      }
    }
    leftCol.appendChild(moodRow);
  }

  // Tags
  const tags = (entry.tags || []).filter((t: string) => t !== 'unified');
  if (tags.length > 0) {
    const tagRow = document.createElement('div');
    tagRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';
    tags.forEach((tag: string) => {
      const chip = document.createElement('span');
      chip.style.cssText = 'font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 9999px; padding: 2px 10px; background: #fff;';
      chip.textContent = `#${tag}`;
      tagRow.appendChild(chip);
    });
    leftCol.appendChild(tagRow);
  }

  contentRow.appendChild(leftCol);
  if (hasRightContent) {
    contentRow.appendChild(rightCol);
  }
  container.appendChild(contentRow);

  // Watermark
  const watermark = document.createElement('div');
  watermark.style.cssText = 'margin-top: 16px; text-align: right; font-size: 11px; color: #d1d5db;';
  watermark.textContent = 'Journal Inc';
  container.appendChild(watermark);

  const canvas = await html2canvas(container, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  document.body.removeChild(container);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

export async function exportJournalsToFile(): Promise<void> {
  const entries = await getAllJournalEntries();
  const settings = useSettings.getState();

  const sorted = [...entries]
    .filter((e: any) => !e.hasDrawing)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sorted.length === 0) throw new Error('No entries to export');

  for (let i = 0; i < sorted.length; i++) {
    const entry = { ...sorted[i] } as any;

    // Decrypt if needed
    if (settings.encryptionEnabled && (settings as any).currentPassphrase && entry.text) {
      try {
        entry.text = await decryptText(entry.text, (settings as any).currentPassphrase);
      } catch {
        entry.text = '[encrypted — could not decrypt]';
      }
    }

    // Load banner blob
    let bannerBlobUrl: string | null = null;
    try {
      const raw = await getJournalEntry(entry.id) as any;
      if (raw?.bannerBlob && raw.bannerBlob instanceof Blob) {
        bannerBlobUrl = URL.createObjectURL(raw.bannerBlob);
      }
    } catch { /* skip */ }

    const imageBlob = await renderEntryToImage(entry, bannerBlobUrl);

    if (bannerBlobUrl) URL.revokeObjectURL(bannerBlobUrl);

    const dateLabel = format(new Date(entry.createdAt), 'yyyy-MM-dd_HHmm');
    const fileName = `journal-${dateLabel}-${i + 1}.png`;

    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Journal Entry',
        url: result.uri,
        dialogTitle: 'Save journal image',
      });
    } else {
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
