import path from "node:path";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from "electron";

import { AppsManager } from "./helpers/apps-manager";
import { ConfigFile } from "./helpers/config-file";
import { MonitoringManager } from "./helpers/monitoring-manager";
import { PropertiesManager } from "./helpers/properties-manager";
import { SettingsManager } from "./helpers/settings-manager";
import { getLogFilePath } from "./utils";
import {
  DeepLink,
  DomainPreferenceType,
  FilterType,
  IpcKeys,
  WAKATIME_PROTOCALL,
} from "./utils/constants";
import { Logging } from "./utils/logging";
import { Wakatime } from "./watchers/wakatime";
import { Watcher } from "./watchers/watcher";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");
process.env.ELECTRON_DIR = app.isPackaged
  ? __dirname
  : path.join(__dirname, "../electron");

const isMacOS = process.platform === "darwin";

let settingsWindow: BrowserWindow | null = null;
let monitoredAppsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let watcher: Watcher | null = null;
let wakatime: Wakatime | null = null;

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

// Register Deep Link `wakatime://`
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(WAKATIME_PROTOCALL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(WAKATIME_PROTOCALL);
}

function getWindowIcon() {
  return nativeImage.createFromPath(
    path.join(process.env.VITE_PUBLIC, "app-icon.png"),
  );
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    title: "Settings",
    icon: getWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    width: 512,
    height: MonitoringManager.isBrowserMonitored() ? 840 : 380,
    show: false,
    autoHideMenuBar: true,
  });

  // Test active push message to Renderer-process.
  // settingsWindow.webContents.on("did-finish-load", () => {
  //   const appSettings = getAppSettings();
  //   settingsWindow?.webContents.send("app-settings", appSettings);
  // });

  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(VITE_DEV_SERVER_URL + "settings");
  } else {
    settingsWindow.loadFile(path.join(process.env.DIST!, "settings.html"));
  }

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });

  settingsWindow.once("ready-to-show", () => {
    settingsWindow?.show();
  });
}

function createMonitoredAppsWindow() {
  monitoredAppsWindow = new BrowserWindow({
    title: "Monitored Apps",
    icon: getWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
    },
    skipTaskbar: true,
    minimizable: false,
    fullscreenable: false,
    width: 444,
    height: 620,
    minWidth: 320,
    minHeight: 320,
    autoHideMenuBar: true,
  });

  if (VITE_DEV_SERVER_URL) {
    monitoredAppsWindow.loadURL(VITE_DEV_SERVER_URL + "monitored-apps");
  } else {
    monitoredAppsWindow.loadFile(
      path.join(process.env.DIST!, "monitored-apps.html"),
    );
  }

  monitoredAppsWindow.on("closed", () => {
    monitoredAppsWindow = null;
  });
}

function openDashboard() {
  shell.openExternal("https://wakatime.com/dashboard");
}

function openSettings() {
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
  } else {
    createSettingsWindow();
  }
}

function openMonitoredApps() {
  if (monitoredAppsWindow) {
    if (monitoredAppsWindow.isMinimized()) monitoredAppsWindow.restore();
    monitoredAppsWindow.focus();
  } else {
    createMonitoredAppsWindow();
  }
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(
    path.join(process.env.VITE_PUBLIC!, "trayIconTemplate.png"),
  );
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Dashboard",
      type: "normal",
      click: openDashboard,
    },
    {
      label: "Settings",
      type: "normal",
      click: openSettings,
    },
    {
      label: "Monitored Apps",
      type: "normal",
      click: openMonitoredApps,
    },
    { type: "separator" },
    {
      label: isMacOS ? "Quit" : "Exit",
      type: "normal",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip("WakaTime");
  tray.setContextMenu(contextMenu);
  tray.addListener("click", () => {
    tray?.popUpContextMenu();
    wakatime?.fetchToday();
  });
}

// Hide app from macOS doc
if (isMacOS) {
  app.dock.hide();
}

const gotTheLock = app.requestSingleInstanceLock();

function handleDeepLink(url: string) {
  const pathname = url.replace(`${WAKATIME_PROTOCALL}://`, "");
  switch (pathname) {
    case DeepLink.settings:
      openSettings();
      break;
    case DeepLink.monitoredApps:
      openMonitoredApps();
      break;
    default:
      break;
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine, _workingDirectory) => {
    const url = commandLine.pop()?.slice(0, -1);
    if (url) {
      handleDeepLink(url);
    }
  });

  app.whenReady().then(async () => {
    createTray();
    wakatime = new Wakatime();
    wakatime.init(tray);
    watcher = new Watcher(wakatime);
    watcher.start();
  });

  app.on("open-url", (_event, url) => {
    handleDeepLink(url);
  });
}

app.on("window-all-closed", () => {});

app.on("activate", () => {});

app.on("quit", () => {
  Logging.instance().log("WakaTime will terminate");
  watcher?.stop();
});

// IPC Events
ipcMain.on(
  IpcKeys.getSetting,
  (event, section: string, key: string, internal: boolean = false) => {
    event.returnValue = ConfigFile.getSetting(section, key, internal);
  },
);

ipcMain.on(
  IpcKeys.setSetting,
  (
    _,
    section: string,
    key: string,
    value: string,
    internal: boolean = false,
  ) => {
    ConfigFile.setSetting(section, key, value, internal);
  },
);

ipcMain.on(IpcKeys.getApps, (event) => {
  event.returnValue = AppsManager.instance().apps;
});

ipcMain.on(IpcKeys.getAppVersion, (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on(IpcKeys.isMonitored, (event, path) => {
  event.returnValue = MonitoringManager.isMonitored(path);
});

ipcMain.on(IpcKeys.setMonitored, (_, path: string, monitor: boolean) => {
  MonitoringManager.set(path, monitor);
});

ipcMain.on(IpcKeys.autoUpdateEnabled, (event) => {
  event.returnValue = PropertiesManager.autoUpdateEnabled;
});
ipcMain.on(IpcKeys.setAutoUpdateEnabled, (_, value) => {
  PropertiesManager.autoUpdateEnabled = value;
});

ipcMain.on(IpcKeys.shouldLogToFile, (event) => {
  event.returnValue = PropertiesManager.shouldLogToFile;
});
ipcMain.on(IpcKeys.setShouldLogToFile, (_, value) => {
  PropertiesManager.shouldLogToFile = value;
});

ipcMain.on(IpcKeys.shouldLaunchOnLogin, (event) => {
  event.returnValue = PropertiesManager.shouldLaunchOnLogin;
});
ipcMain.on(IpcKeys.setShouldLaunchOnLogin, (_, value) => {
  if (value) {
    SettingsManager.registerAsLogInItem();
  } else {
    SettingsManager.unregisterAsLogInItem();
  }
});

ipcMain.on(IpcKeys.codeTimeInStatusBar, (event) => {
  event.returnValue = PropertiesManager.showCodeTimeInStatusBar;
});
ipcMain.on(IpcKeys.setCodeTimeInStatusBar, (_, value) => {
  PropertiesManager.showCodeTimeInStatusBar = value;
  wakatime?.fetchToday();
});

ipcMain.on(IpcKeys.logFilePath, (event) => {
  event.returnValue = getLogFilePath();
});

ipcMain.on(IpcKeys.isBrowserMonitored, (event) => {
  event.returnValue = MonitoringManager.isBrowserMonitored();
});

ipcMain.on(IpcKeys.getDomainPreference, (event) => {
  event.returnValue = PropertiesManager.domainPreference;
});
ipcMain.on(IpcKeys.setDomainPreference, (_, value: DomainPreferenceType) => {
  PropertiesManager.domainPreference = value;
});

ipcMain.on(IpcKeys.getFilterType, (event) => {
  event.returnValue = PropertiesManager.filterType;
});
ipcMain.on(IpcKeys.setFilterType, (_, value: FilterType) => {
  PropertiesManager.filterType = value;
});

ipcMain.on(IpcKeys.getDenylist, (event) => {
  event.returnValue = PropertiesManager.denylist;
});
ipcMain.on(IpcKeys.setDenylist, (_, value: string) => {
  PropertiesManager.denylist = value;
});

ipcMain.on(IpcKeys.getAllowlist, (event) => {
  event.returnValue = PropertiesManager.allowlist;
});
ipcMain.on(IpcKeys.setAllowlist, (_, value: string) => {
  PropertiesManager.allowlist = value;
});
