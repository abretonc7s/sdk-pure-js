interface CustomModalProps {
  onClose: () => void;
  qrCodeUrl: string;
}

function CustomModal({ onClose, qrCodeUrl }: CustomModalProps): HTMLElement {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'custom-modal';
  modalContainer.innerHTML = `
    <div class="modal-content">
      <button id="closeModalButton">Close</button>
      <h2>Scan QR Code to Connect</h2>
      <img src="${qrCodeUrl}" alt="QR Code" />
    </div>
  `;

  const closeButton = modalContainer.querySelector('#closeModalButton');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      onClose();
    });
  }

  return modalContainer;
}

export default CustomModal;
