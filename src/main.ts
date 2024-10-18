import './style.css'
import { MetaMaskSDK, SDKProvider } from '@metamask/sdk'
import CustomModal from './CustomModal';
import QRCode from 'qrcode';

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

// Update the EIP6963AnnounceProviderEvent interface
interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: {
    info: EIP6963ProviderInfo;
    provider: any;
  };
}

let providers: Array<{ info: EIP6963ProviderInfo; provider: any }> = [];
let provider: SDKProvider | undefined;
let lastResponse: string = '';

// Updated function to detect providers using EIP-6963
function detectProviders(): Promise<Array<{ info: EIP6963ProviderInfo; provider: any }>> {
  return new Promise((resolve) => {
    function handleAnnouncementEvent(event: EIP6963AnnounceProviderEvent) {
      providers.push({ info: event.detail.info, provider: event.detail.provider });
    }

    window.addEventListener('eip6963:announceProvider', handleAnnouncementEvent as EventListener);

    // Dispatch the request event
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Resolve after a timeout
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handleAnnouncementEvent as EventListener);
      resolve(providers);
    }, 1000);
  });
}

// Updated main setup function
async function setup(): Promise<void> {
  const detectedProviders = await detectProviders();
  displayDetectedProviders(detectedProviders.map(p => p.info));

  const isMetaMaskInstalled = detectedProviders.some(p => p.info.rdns === 'io.metamask');

  console.log(isMetaMaskInstalled ? 'MetaMask extension detected' : 'MetaMask extension not detected');

  sdk = new MetaMaskSDK({
    logging: {
      developerMode: true,
      plaintext: true,
    },
    communicationServerUrl: 'https://socketdev.siteed.net',
    extensionOnly: true, // Changed to false to allow mobile connections
    checkInstallationImmediately: false,
    dappMetadata: {
      name: 'My Dapp',
      url: window.location.protocol + '//' + window.location.host,
    },
    headless: true,
  });

  sdk.onAny((event) => {
    console.log('Event:', event);
  });

  sdk.on('initialized', (initProps) => {
    console.log('initialized:', initProps);
    if (initProps.isConnected) {
      console.log('ready to connect');
      updateUIOnConnect();
    }
  });

  await sdk.init();
  console.log('MetaMask SDK initialized');

  const status = sdk.getWalletStatus();
  console.log('Wallet status:', status);
  provider = sdk.getProvider();

  if(!provider) {
    console.log('No provider found');
    return;
  }

  // Update this event listener to close the modal when connected
  provider.on('connected', () => {
    console.log('Provider connected');
    closeModal();
    updateUIOnConnect();
  });

  provider.on('disconnect', () => {
    console.log('Provider disconnected');
    closeModal();
    updateUIOnDisconnect();
  });

  setupEventListeners(provider);

  // Check if we're already connected and update UI if necessary
  if (provider && provider.isConnected()) {
    updateUIOnConnect();
  }
}

// Update the HTML template
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>MetaMask Connection Demo</h1>
    <div id="providerContainer"></div>
    <div class="card">
      <button id="connectButton">Connect MetaMask</button>
      <button id="signButton" style="display: none;">Sign Message</button>
    </div>
  </div>
`

// Updated function to display detected providers
function displayDetectedProviders(providers: EIP6963ProviderInfo[]): void {
  const providerContainer = document.querySelector<HTMLDivElement>('#providerContainer')!;
  
  if (providers.length === 0) {
    providerContainer.innerHTML = '<p>No providers detected.</p>';
    return;
  }

  const providerList = document.createElement('ul');
  providerList.id = 'providerList';
  providers.forEach(provider => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <img src="${provider.icon}" alt="${provider.name}" width="24" height="24">
      ${provider.name} (${provider.rdns})
    `;
    providerList.appendChild(listItem);
  });

  providerContainer.innerHTML = '<h2>Detected Providers:</h2>';
  providerContainer.appendChild(providerList);
}

// Start the setup process
setup().catch(console.error);

// Extract these functions outside of setupMetaMask
function updateUIOnConnect(): void {
  const card = document.querySelector<HTMLDivElement>('.card');
  if (!card) return;

  // Main buttons section
  let buttonsSection = document.querySelector<HTMLDivElement>('#buttonsSection');
  if (!buttonsSection) {
    buttonsSection = document.createElement('div');
    buttonsSection.id = 'buttonsSection';
    card.appendChild(buttonsSection);
  }

  let connectButton = document.querySelector<HTMLButtonElement>('#connectButton');
  if (!connectButton) {
    connectButton = document.createElement('button');
    connectButton.id = 'connectButton';
    buttonsSection.appendChild(connectButton);
  }
  connectButton.textContent = 'Connected';

  let signButton = document.querySelector<HTMLButtonElement>('#signButton');
  if (!signButton) {
    signButton = document.createElement('button');
    signButton.id = 'signButton';
    buttonsSection.appendChild(signButton);
  }
  signButton.textContent = 'Sign Message';
  signButton.style.display = 'inline-block';

  let changeAccountButton = document.querySelector<HTMLButtonElement>('#changeAccountButton');
  if (!changeAccountButton) {
    changeAccountButton = document.createElement('button');
    changeAccountButton.id = 'changeAccountButton';
    changeAccountButton.textContent = 'Change Account';
    buttonsSection.appendChild(changeAccountButton);
  }
  changeAccountButton.style.display = 'inline-block';

  let refreshAccountsButton = document.querySelector<HTMLButtonElement>('#refreshAccountsButton');
  if (!refreshAccountsButton) {
    refreshAccountsButton = document.createElement('button');
    refreshAccountsButton.id = 'refreshAccountsButton';
    refreshAccountsButton.textContent = 'Refresh Accounts';
    buttonsSection.appendChild(refreshAccountsButton);
  }
  refreshAccountsButton.style.display = 'inline-block';

  // Accounts display section
  let accountsDisplay = document.querySelector<HTMLDivElement>('#accountsDisplay');
  if (!accountsDisplay) {
    accountsDisplay = document.createElement('div');
    accountsDisplay.id = 'accountsDisplay';
    card.appendChild(accountsDisplay);
  }

  // Terminate button section
  let terminateSection = document.querySelector<HTMLDivElement>('#terminateSection');
  if (!terminateSection) {
    terminateSection = document.createElement('div');
    terminateSection.id = 'terminateSection';
    terminateSection.style.marginTop = '20px';
    card.appendChild(terminateSection);
  }

  let terminateButton = document.querySelector<HTMLButtonElement>('#terminateButton');
  if (!terminateButton) {
    terminateButton = document.createElement('button');
    terminateButton.id = 'terminateButton';
    terminateButton.textContent = 'Terminate Connection';
    terminateButton.style.backgroundColor = '#ff4136';
    terminateButton.style.color = 'white';
    terminateSection.appendChild(terminateButton);
  }
  terminateButton.style.display = 'block';

  // Add this new section for last response
  let lastResponseElement = document.querySelector<HTMLDivElement>('#lastResponse');
  if (!lastResponseElement) {
    lastResponseElement = document.createElement('div');
    lastResponseElement.id = 'lastResponse';
    card.appendChild(lastResponseElement);
  }
  updateLastResponse(lastResponse);

  setupButtonListeners();
  updateAccountsDisplay().catch(console.error);
}

function updateUIOnDisconnect(): void {
  const connectButton = document.querySelector<HTMLButtonElement>('#connectButton');
  const signButton = document.querySelector<HTMLButtonElement>('#signButton');
  const terminateButton = document.querySelector<HTMLButtonElement>('#terminateButton');
  const changeAccountButton = document.querySelector<HTMLButtonElement>('#changeAccountButton');
  const refreshAccountsButton = document.querySelector<HTMLButtonElement>('#refreshAccountsButton');
  const accountsDisplay = document.querySelector<HTMLDivElement>('#accountsDisplay');
  const terminateSection = document.querySelector<HTMLDivElement>('#terminateSection');

  if (connectButton) connectButton.textContent = 'Connect MetaMask';
  if (signButton) signButton.style.display = 'none';
  if (changeAccountButton) changeAccountButton.style.display = 'none';
  if (refreshAccountsButton) refreshAccountsButton.style.display = 'none';
  if (accountsDisplay) accountsDisplay.textContent = '';
  if (terminateSection) terminateSection.style.display = 'none';
}

async function updateAccountsDisplay(): Promise<void> {
  const accountsDisplay = document.querySelector<HTMLDivElement>('#accountsDisplay')!;
  try {
    const accounts = await provider?.request({ method: 'eth_accounts' }) as string[];
    if (accounts && accounts.length > 0) {
      accountsDisplay.innerHTML = `<h3>Connected Accounts:</h3>
        <ul>${accounts.map((account: string) => `<li>${account}</li>`).join('')}</ul>`;
    } else {
      accountsDisplay.textContent = 'No accounts connected';
    }
    console.log('Accounts updated:', accounts);
  } catch (error) {
    console.error('Failed to get accounts:', error);
    accountsDisplay.textContent = 'Failed to retrieve accounts';
  }
}

// Move setupEventListeners outside of setupMetaMask
function setupEventListeners(provider: any): void {
  provider.on('connect', (connectInfo: { chainId: string }) => {
    console.log('Connected to chain:', connectInfo.chainId)
    updateUIOnConnect()
  })

  provider.on('disconnect', (error: { code: number; message: string }) => {
    console.log('Disconnected:', error)
    updateUIOnDisconnect()
  })

  provider.on('chainChanged', (chainId: string) => {
    console.log('Chain changed to:', chainId)
  })

  provider.on('accountsChanged', (accounts: string[]) => {
    console.log('Accounts changed:', accounts)
    if (accounts.length === 0) {
      updateUIOnDisconnect()
    } else {
      updateUIOnConnect()
    }
  })

  provider.on('display_uri', (uri: string) => {
    console.log('QR Code URI:', uri)
    displayQRCode(uri)
  })
}

// Add this type declaration to avoid TypeScript errors
declare global {
  interface Window {
    // @ts-expect-error
    ethereum?: any;
  }
}

let currentModal: HTMLElement | null = null;
let isModalOpen = false;
let sdk: MetaMaskSDK;
let listenersSetup = false;

// Add this utility function to detect mobile browsers
function isMobileBrowser(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const displayQRCode = async (uri: string): Promise<void> => {
  console.log('Handling connection URI:', uri);

  if (isMobileBrowser()) {
    console.log('Mobile browser detected');
    return;
  }

  // For desktop browsers, display the QR code
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 200, margin: 2 });
    console.log('QR code generated successfully');

    if (isModalOpen && currentModal) {
      // Update existing modal
      const qrCodeImg = currentModal.querySelector('#qrCodeImage') as HTMLImageElement;
      if (qrCodeImg) {
        qrCodeImg.src = qrCodeDataUrl;
        console.log('QR code updated in existing modal');
      }
    } else {
      // Create new modal
      if (currentModal) {
        document.body.removeChild(currentModal);
      }

      currentModal = CustomModal({
        onClose: () => {
          console.log('Modal close requested');
          if (currentModal && document.body.contains(currentModal)) {
            document.body.removeChild(currentModal);
            currentModal = null;
            isModalOpen = false;
            console.log('Modal closed and removed from DOM');
          }
        },
        qrCodeUrl: qrCodeDataUrl
      });

      document.body.appendChild(currentModal);
      isModalOpen = true;
      console.log('New modal appended to body');
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
  }
};

// Update the handleConnectClick function
async function handleConnectClick(): Promise<void> {
  console.log('Connect button clicked');
  if (provider?.isConnected()) {
    console.log('Already connected');
    updateLastResponse('Already connected');
    return;
  }
  try {
    closeModal();
    await sdk.connect();
    console.log('Connected successfully', provider);
    updateLastResponse('Connected successfully');
    closeModal();
  } catch (error: unknown) {
    console.error('Failed to connect:', error);
    if (error instanceof Error) {
      updateLastResponse(`Connection failed: ${error.message}`);
      alert(`Connection failed: ${error.message}`);
    } else {
      updateLastResponse('Connection failed due to an unknown error');
      alert('Connection failed due to an unknown error');
    }
    closeModal();
  }
}

// Update the closeModal function to be more robust
function closeModal(): void {
  if (currentModal && isModalOpen) {
    const closeButton = currentModal.querySelector('#closeModalButton') as HTMLElement;
    if (closeButton) {
      closeButton.click();
    } else {
      // If the close button is not found, remove the modal directly
      document.body.removeChild(currentModal);
      currentModal = null;
      isModalOpen = false;
    }
    console.log('Modal closed');
  }
}

// Update the connect button event listener
const connectButton = document.getElementById('connectButton');
if (connectButton) {
  connectButton?.removeEventListener('click', handleConnectClick);
  connectButton.addEventListener('click', () => {
    handleConnectClick().catch(console.error);
  });
}

// Add the missing setupButtonListeners function
function setupButtonListeners(): void {
  if (listenersSetup) return;

  // Prevent duplicate listeners
  listenersSetup = true;
  const signButton = document.querySelector<HTMLButtonElement>('#signButton');
  const terminateButton = document.querySelector<HTMLButtonElement>('#terminateButton');
  const changeAccountButton = document.querySelector<HTMLButtonElement>('#changeAccountButton');
  const refreshAccountsButton = document.querySelector<HTMLButtonElement>('#refreshAccountsButton');

  signButton?.removeEventListener('click', handleSignMessage);
  signButton?.addEventListener('click', handleSignMessage);

  terminateButton?.removeEventListener('click', handleTerminate);
  terminateButton?.addEventListener('click', handleTerminate);

  changeAccountButton?.removeEventListener('click', handleChangeAccount);
  changeAccountButton?.addEventListener('click', handleChangeAccount);

  refreshAccountsButton?.removeEventListener('click', handleRefreshAccounts);
  refreshAccountsButton?.addEventListener('click', handleRefreshAccounts);
}

// Add these new handler functions
async function handleSignMessage(): Promise<void> {
  try {
    const accounts = await provider?.request({ method: 'eth_accounts' }) as string[];
    if(accounts.length === 0) {
      updateLastResponse('No accounts connected');
      alert('No accounts connected');
      return;
    }
    const message = 'Hello, MetaMask!';
    const signature = await provider?.request({
      method: 'personal_sign',
      params: [message, accounts[0], 'Example password'],
    });
    console.log('Signature:', signature);
    updateLastResponse(`Message signed successfully! Signature: ${signature}`);
  } catch (error) {
    console.error('Failed to sign message:', error);
    if (error instanceof Error) {
      updateLastResponse(`Failed to sign message: ${error.message}`);
      alert(`Failed to sign message: ${error.message}`);
    } else {
      updateLastResponse('Failed to sign message due to an unknown error');
      alert('Failed to sign message due to an unknown error');
    }
  }
}

async function handleTerminate(): Promise<void> {
  try {
    console.log('Terminate connection requested');
    await sdk.terminate();
    updateLastResponse('Connection terminated');
    updateUIOnDisconnect();
  } catch (error) {
    console.error('Failed to terminate connection:', error);
    if (error instanceof Error) {
      updateLastResponse(`Failed to terminate connection: ${error.message}`);
    } else {
      updateLastResponse('Failed to terminate connection due to an unknown error');
    }
  }
}

async function handleChangeAccount(): Promise<void> {
  try {
    await provider?.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    console.log('Account change requested');
    updateLastResponse('Account change requested');
  } catch (error) {
    console.error('Failed to request account change:', error);
    if (error instanceof Error) {
      updateLastResponse(`Failed to request account change: ${error.message}`);
    } else {
      updateLastResponse('Failed to request account change due to an unknown error');
    }
  }
}

// Add this new function to update and display the last response
function updateLastResponse(response: string): void {
  lastResponse = response;
  const lastResponseElement = document.querySelector<HTMLDivElement>('#lastResponse');
  if (lastResponseElement) {
    lastResponseElement.textContent = `Last Response: ${lastResponse}`;
  }
}

// Modify the handleRefreshAccounts function
async function handleRefreshAccounts(): Promise<void> {
  console.log('Refresh Accounts button clicked');
  try {
    await updateAccountsDisplay();
    updateLastResponse('Accounts refreshed');
  } catch (error) {
    console.error('Failed to refresh accounts:', error);
    if (error instanceof Error) {
      updateLastResponse(`Failed to refresh accounts: ${error.message}`);
    } else {
      updateLastResponse('Failed to refresh accounts due to an unknown error');
    }
  }
}
