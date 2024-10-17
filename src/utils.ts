import QRCode from 'qrcode';

export function isMobileBrowser(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const displayQRCode = async (uri: string): Promise<void> => {
  const qrCodeContainer = document.getElementById('qr-code-container');
  if (!qrCodeContainer) {
    console.error('QR code container not found');
    return;
  }

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 300 });
    const qrCodeImage = document.createElement('img');
    qrCodeImage.src = qrCodeDataUrl;
    qrCodeImage.alt = 'QR Code';
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(qrCodeImage);
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }
};

export function closeModal(): void {
  const modal = document.querySelector('.modal') as HTMLElement;
  if (modal) {
    modal.style.display = 'none';
  }
}
