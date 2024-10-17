export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: {
    info: EIP6963ProviderInfo;
    provider: any;
  };
}
