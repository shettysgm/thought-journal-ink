import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { getAllJournalEntries, getJournalEntry } from '@/lib/idb';
import { decryptText } from '@/lib/crypto';
import { useSettings } from '@/store/useSettings';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

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

  // Date header
  const dateStr = entry.updatedAt
    ? `${format(new Date(entry.createdAt), 'MMM d, yyyy')} • Updated ${format(new Date(entry.updatedAt), 'h:mm a')}`
    : format(new Date(entry.createdAt), 'MMM d, yyyy • h:mm a');

  const dateEl = document.createElement('div');
  dateEl.style.cssText = 'font-size: 13px; color: #6b7280; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;';
  dateEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>${dateStr}</span>`;
  container.appendChild(dateEl);

  // Banner image
  if (bannerBlobUrl) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'margin-bottom: 16px; border-radius: 10px; overflow: hidden;';
    const img = document.createElement('img');
    img.src = bannerBlobUrl;
    img.style.cssText = 'width: 100%; height: 160px; object-fit: cover; display: block;';
    img.crossOrigin = 'anonymous';
    imgWrap.appendChild(img);
    container.appendChild(imgWrap);
    // Wait for image to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      if (img.complete) resolve();
    });
  }

  // Journal text
  if (entry.text) {
    const textBox = document.createElement('div');
    textBox.style.cssText = `
      background: #f9fafb; border-radius: 10px; padding: 16px;
      margin-bottom: 16px; font-size: 15px; line-height: 1.6;
      color: #1f2937; white-space: pre-wrap; word-break: break-word;
    `;
    textBox.textContent = entry.text;
    container.appendChild(textBox);
  }

  // Mood stickers
  if (entry.stickers && entry.stickers.length > 0) {
    const stickerMap: Record<string, string> = {
      'heart-pink': '💗', 'heart-red': '❤️', 'heart-purple': '💜',
      'sun': '☀️', 'cloud': '☁️', 'rainbow': '🌈',
      'flower-pink': '🌸', 'flower-purple': '🌺', 'butterfly': '🦋',
      'star-yellow': '⭐', 'star-pink': '💖', 'crown': '👑',
      'diamond': '💎', 'bubble-blue': '💬', 'bubble-green': '💭',
      'arrow-purple': '↗️', 'arrow-orange': '➡️', 'thumbs-up': '👍',
    };
    const moodRow = document.createElement('div');
    moodRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;';
    const label = document.createElement('span');
    label.style.cssText = 'font-size: 13px; color: #6b7280;';
    label.textContent = 'Mood:';
    moodRow.appendChild(label);
    entry.stickers.forEach((id: string) => {
      const badge = document.createElement('span');
      badge.style.cssText = 'font-size: 18px; background: #f3f4f6; border-radius: 6px; padding: 2px 8px; border: 1px solid #e5e7eb;';
      badge.textContent = stickerMap[id] || id;
      moodRow.appendChild(badge);
    });
    container.appendChild(moodRow);
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
    container.appendChild(tagRow);
  }

  // Watermark
  const watermark = document.createElement('div');
  watermark.style.cssText = 'margin-top: 16px; text-align: right; font-size: 11px; color: #d1d5db;';
  watermark.textContent = 'Journal Inc';
  container.appendChild(watermark);

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
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

  // Sort by date descending
  const sorted = [...entries]
    .filter((e: any) => !e.hasDrawing)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sorted.length === 0) throw new Error('No entries to export');

  // Process each entry: decrypt + render to image
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
      // Convert blob to base64 for Capacitor
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
      // Web: download each image
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
