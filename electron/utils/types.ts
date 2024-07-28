export type Category =
  | "browsing"
  | "building"
  | "code reviewing"
  | "coding"
  | "communicating"
  | "debugging"
  | "designing"
  | "indexing"
  | "learning"
  | "manual testing"
  | "meeting"
  | "planning"
  | "researching"
  | "running tests"
  | "translating"
  | "writing docs"
  | "writing tests";

export type EntityType = "file" | "app";

export type MonitoredApp =
  | "arcbrowser"
  | "brave"
  | "canva"
  | "chrome"
  | "figma"
  | "firefox"
  | "imessage"
  | "iterm2"
  | "powershell"
  | "linear"
  | "notes"
  | "notion"
  | "postman"
  | "safari"
  | "safaripreview"
  | "microsoft_edge"
  | "slack"
  | "tableplus"
  | "mac_terminal"
  | "windows_terminal"
  | "warp"
  | "wecom"
  | "whatsapp"
  | "xcode"
  | "zoom";

export type MonitoredAppInfo = {
  id: MonitoredApp;
  mac?: {
    bundleId: string;
  };
  windows?: {
    exePath?: string;
    DisplayName?: string;
  };
  isBrowser?: boolean;
  isDefaultEnabled?: boolean;
  isElectronApp?: boolean;
};
