/**
 * Attempts to capture a single frame of the current viewport using the
 * browser's native screen-sharing API. Because Mosaic runs in many sandboxed
 * / embedded environments where `getDisplayMedia` is unavailable or the user
 * denies permission, this always resolves successfully — falling back to a
 * generated placeholder image so the feedback flow never breaks.
 */
export async function captureViewportScreenshot(): Promise<string> {
  const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;

  if (mediaDevices?.getDisplayMedia) {
    try {
      const stream = await mediaDevices.getDisplayMedia({ video: true });
      const dataUrl = await grabFrameAsDataUrl(stream);
      stream.getTracks().forEach((track) => track.stop());
      return dataUrl;
    } catch {
      // Permission denied, unsupported, or the frame capture failed —
      // fall through to the placeholder below.
    }
  }

  return generatePlaceholderScreenshot();
}

function grabFrameAsDataUrl(stream: MediaStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;

    video.onloadedmetadata = () => {
      video
        .play()
        .then(() => {
          // Give the video element a tick to render the first real frame.
          requestAnimationFrame(() => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 1280;
              canvas.height = video.videoHeight || 720;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas 2D context unavailable'));
                return;
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/png'));
            } catch (err) {
              reject(err);
            }
          });
        })
        .catch(reject);
    };

    video.onerror = () => reject(new Error('Failed to load capture stream'));
  });
}

function generatePlaceholderScreenshot(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Extremely unlikely, but keep the contract of "always resolves".
    return 'data:image/png;base64,';
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0e4229');
  gradient.addColorStop(1, '#092e1f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Screenshot capture unavailable in this environment', canvas.width / 2, canvas.height / 2);

  ctx.font = '400 16px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 40);

  return canvas.toDataURL('image/png');
}
