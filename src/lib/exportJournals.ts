import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllJournalEntries, getJournalEntry } from '@/lib/idb';
import { decryptText } from '@/lib/crypto';
import { useSettings } from '@/store/useSettings';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ALL_STICKERS } from '@/components/KawaiiStickers';
import { CARD_PATTERNS, CARD_BORDERS } from '@/components/CardBackgroundPicker';

/** Render a React sticker component into a container and wait for images to load */
async function renderStickerToElement(stickerId: string, size: number): Promise<HTMLElement | null> {
  const stickerDef = ALL_STICKERS.find(s => s.id === stickerId);
  if (!stickerDef) return null;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display: inline-block; width: ${size}px; height: ${size}px;`;

  const root = ReactDOM.createRoot(wrapper);
  root.render(React.createElement(stickerDef.component, { size, ...(stickerDef.props as any) }));

  await new Promise(r => setTimeout(r, 200));

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

/** Convert CSS hsl(var(--xxx)) patterns to actual colors for export */
function resolvePatternStyle(patternId: string | undefined): string {
  if (!patternId || patternId === 'none') return '';
  const pattern = CARD_PATTERNS.find(p => p.id === patternId);
  if (!pattern?.style) return '';

  // Get computed CSS variables from root
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  let css = '';
  const style = pattern.style;
  if (style.backgroundImage) {
    let bgImage = style.backgroundImage as string;
    // Replace hsl(var(--xxx) / y) with actual computed values
    bgImage = bgImage.replace(/hsl\(var\(--([^)]+)\)\s*\/\s*([^)]+)\)/g, (_, varName, alpha) => {
      const val = computedStyle.getPropertyValue(`--${varName}`).trim();
      return val ? `hsla(${val}, ${alpha.trim()})` : 'transparent';
    });
    bgImage = bgImage.replace(/hsl\(var\(--([^)]+)\)\)/g, (_, varName) => {
      const val = computedStyle.getPropertyValue(`--${varName}`).trim();
      return val ? `hsl(${val})` : 'transparent';
    });
    css += `background-image: ${bgImage};`;
  }
  if (style.backgroundSize) {
    css += ` background-size: ${style.backgroundSize};`;
  }
  return css;
}

/** Get border style for export */
function resolveBorderStyle(borderId: string | undefined): string {
  if (!borderId || borderId === 'none') return 'border: 1px solid #e5e7eb;';
  const border = CARD_BORDERS.find(b => b.id === borderId);
  if (!border) return 'border: 1px solid #e5e7eb;';

  const colorMap: Record<string, string> = {
    rose: '#fda4af', sky: '#7dd3fc', amber: '#fcd34d',
    emerald: '#6ee7b7', violet: '#c4b5fd', orange: '#fdba74',
  };

  switch (borderId) {
    case 'dashed': return 'border: 2px dashed rgba(107,114,128,0.3);';
    case 'double': return 'border: 4px double rgba(107,114,128,0.25);';
    case 'thick': return 'border: 3px solid rgba(31,41,55,0.15);';
    default: return `border: 2px solid ${colorMap[borderId] || '#e5e7eb'};`;
  }
}

/** Build a self-contained HTML card for one entry and capture it as a PNG blob */
async function renderEntryToImage(entry: any, bannerBlobUrl: string | null): Promise<Blob> {
  const patternCss = resolvePatternStyle(entry.cardBackground);
  const borderCss = resolveBorderStyle(entry.cardBorder);

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 420px;
    background: #fff; border-radius: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    ${borderCss}
    ${patternCss}
    overflow: hidden;
  `;

  document.body.appendChild(container);

  // Banner image on top (full width) — use background-image for proper cover behavior in html2canvas
  if (bannerBlobUrl) {
    const bannerDiv = document.createElement('div');
    bannerDiv.style.cssText = `width: 100%; height: 160px; background-image: url(${bannerBlobUrl}); background-size: cover; background-position: center;`;
    container.appendChild(bannerDiv);
    // Preload image so html2canvas can render it
    await new Promise<void>(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = bannerBlobUrl;
      if (img.complete) resolve();
    });
  }

  // Content area with padding
  const contentArea = document.createElement('div');
  contentArea.style.cssText = 'padding: 20px 28px 28px;';

  // Banner sticker floated top-right (only when no photo)
  if (!bannerBlobUrl && entry.bannerSticker && typeof entry.bannerSticker === 'string') {
    const stickerEl = await renderStickerToElement(entry.bannerSticker, 72);
    if (stickerEl) {
      stickerEl.style.cssText += 'float: right; margin: -4px -8px 8px 12px;';
      contentArea.appendChild(stickerEl);
    }
  }

  // Date header
  const dateStr = entry.updatedAt
    ? `${format(new Date(entry.createdAt), 'MMM d, yyyy')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}`
    : format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a');

  const dateEl = document.createElement('div');
  dateEl.style.cssText = 'font-size: 13px; color: #6b7280; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;';
  dateEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${dateStr}</span>`;
  contentArea.appendChild(dateEl);

  // Journal text
  if (entry.text) {
    const textBox = document.createElement('div');
    textBox.style.cssText = `
      background: rgba(249,250,251,0.8); border-radius: 10px; padding: 16px;
      margin-bottom: 12px; font-size: 15px; line-height: 1.6;
      color: #1f2937; white-space: pre-wrap; word-break: break-word;
    `;
    textBox.textContent = entry.text;
    contentArea.appendChild(textBox);
  }

  // Mood stickers row
  if (entry.stickers && entry.stickers.length > 0) {
    const moodRow = document.createElement('div');
    moodRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; clear: both;';
    const label = document.createElement('span');
    label.style.cssText = 'font-size: 13px; color: #6b7280;';
    label.textContent = 'Mood:';
    moodRow.appendChild(label);

    const emojiMap: Record<string, string> = {
      'heart-pink': '💗', 'heart-red': '❤️', 'heart-purple': '💜',
      'sun': '☀️', 'cloud': '☁️', 'rainbow': '🌈',
      'flower-pink': '🌸', 'flower-purple': '🌺', 'butterfly': '🦋',
      'star-yellow': '⭐', 'star-pink': '💖', 'crown': '👑',
      'diamond': '💎', 'bubble-blue': '💬', 'bubble-green': '💭',
      'arrow-purple': '↗️', 'arrow-orange': '➡️', 'thumbs-up': '👍',
    };

    for (const id of entry.stickers) {
      const stickerEl = await renderStickerToElement(id, 28);
      if (stickerEl) {
        stickerEl.style.cssText += 'background: #f3f4f6; border-radius: 6px; padding: 2px 4px; border: 1px solid #e5e7eb; display: inline-flex; align-items: center; justify-content: center;';
        moodRow.appendChild(stickerEl);
      } else {
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size: 18px; background: #f3f4f6; border-radius: 6px; padding: 2px 8px; border: 1px solid #e5e7eb;';
        badge.textContent = emojiMap[id] || id;
        moodRow.appendChild(badge);
      }
    }
    contentArea.appendChild(moodRow);
  }

  // Tags
  const tags = (entry.tags || []).filter((t: string) => t !== 'unified');
  if (tags.length > 0) {
    const tagRow = document.createElement('div');
    tagRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; clear: both;';
    tags.forEach((tag: string) => {
      const chip = document.createElement('span');
      chip.style.cssText = 'font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 9999px; padding: 2px 10px; background: #fff;';
      chip.textContent = `#${tag}`;
      tagRow.appendChild(chip);
    });
    contentArea.appendChild(tagRow);
  }

  // Watermark
  const watermark = document.createElement('div');
  watermark.style.cssText = 'margin-top: 16px; text-align: right; font-size: 11px; color: #d1d5db; clear: both;';
  watermark.textContent = 'Journal Inc';
  contentArea.appendChild(watermark);

  container.appendChild(contentArea);

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
