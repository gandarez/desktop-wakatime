export enum IpcKeys {
  getApps = "get_apps",
  getAppVersion = "get_app_version",
  getSetting = "get_setting",
  setSetting = "set_setting",
  isMonitored = "is_monitored",
  setMonitored = "set_monitored",
  shouldLogToFile = "should_log_to_file",
  setShouldLogToFile = "set_should_log_to_file",
  shouldLaunchOnLogin = "should_launch_on_login",
  setShouldLaunchOnLogin = "set_should_launch_on_login",
  logFilePath = "log_file_path",
  isBrowserMonitored = "is_browser_monitored",
  getDomainPreference = "get_domain_preference",
  setDomainPreference = "set_domain_preference",
  getFilterType = "get_filter_type",
  setFilterType = "set_filter_type",
  getDenylist = "get_denylist",
  setDenylist = "set_denylist",
  getAllowlist = "get_allowlist",
  setAllowlist = "set_allowlist",
}

export enum FilterType {
  denylist = "denylist",
  allowlist = "allowlist",
}

export enum DomainPreferenceType {
  domain = "domain",
  url = "url",
}

export enum DeepLink {
  settings = "settings",
  monitoredApps = "monitoredApps",
}

export const WAKATIME_PROTOCALL = "wakatime";
