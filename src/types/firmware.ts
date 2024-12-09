export interface GithubRelease {
    tag_name: string;
    assets: {
      name: string;
      browser_download_url: string;
    }[];
  }
  
  export interface FirmwareData {
    version: string;
    path: string;
  }
  
  export interface BoardData {
    name: string;
    supported_firmware: FirmwareData[];
  }
  
  export interface DeviceData {
    name: string;
    boards: BoardData[];
  }