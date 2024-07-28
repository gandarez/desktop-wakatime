import { WindowInfo } from "@miniben90/x-win";

import { DomainPreferenceType } from "../utils/constants";
import { Category } from "../utils/types";
import { AppData } from "../utils/validators";
import { FilterManager } from "./filter-manager";
import { PropertiesManager } from "./properties-manager";

export class MonitoredApp {
  static heartbeatData(windowInfo: WindowInfo, app: AppData) {
    const entity = this.entity(windowInfo, app);
    const category = this.category(app);
    const language = this.language(app);
    const project = this.project(windowInfo);
    if (!entity) {
      return null;
    }
    return {
      entity,
      category,
      language,
      project,
    };
  }
  static category(app: AppData): Category | null {
    switch (app.id) {
      case "arcbrowser":
      case "brave":
      case "chrome":
      case "firefox":
      case "safari":
      case "safaripreview":
        return "browsing";

      case "imessage":
      case "slack":
      case "wecom":
        return "communicating";

      case "iterm2":
      case "mac_terminal":
      case "windows_terminal":
      case "powershell":
      case "warp":
      case "xcode":
        return "coding";

      case "postman":
      case "tableplus":
        return "debugging";

      case "notes":
      case "notion":
        return "writing docs";

      case "canva":
      case "figma":
        return "designing";

      case "whatsapp":
      case "zoom":
        return "meeting";
      default:
        return null;
    }
  }
  static language(app: AppData) {
    switch (app.id) {
      case "figma":
        return "Figma Design";
      case "postman":
        return "HTTP Request";
      default:
        return null;
    }
  }
  static project({ url }: WindowInfo) {
    if (!url) {
      return null;
    }
    const patterns = [
      /github\.com\/([^\/]+\/[^\/]+)\/?.*$/,
      /bitbucket\.org\/([^\/]+\/[^\/]+)\/?.*$/,
      /app\.circleci\.com\/.*\/?(github|bitbucket|gitlab)\/([^\/]+\/[^\/]+)\/?.*$/,
      /app\.travis-ci\.com\/(github|bitbucket|gitlab)\/([^\/]+\/[^\/]+)\/?.*$/,
      /app\.travis-ci\.org\/(github|bitbucket|gitlab)\/([^\/]+\/[^\/]+)\/?.*$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // Adjusted to capture the right group based on the pattern.
        // The group index might be 2 if the pattern includes a platform prefix before the project name.
        const groupIndex = pattern.source.includes("(github|bitbucket|gitlab)")
          ? 2
          : 1;
        return match[groupIndex];
      }
    }

    // Return null if no pattern matches
    return null;
  }

  static entity(windowInfo: WindowInfo, app: AppData) {
    if (app.isBrowser) {
      if (windowInfo.url && FilterManager.filterBrowsedSites(windowInfo.url)) {
        if (
          PropertiesManager.domainPreference === DomainPreferenceType.domain
        ) {
          return this.domainFromUrl(windowInfo.url);
        }
        return windowInfo.url;
      }
      return null;
    }

    switch (app.id) {
      // TODO: Will implement these later as it's a complex task and even if it's possible with electron.
      // case 'canva':

      //   break;
      // case 'notes':

      //   break;

      default:
        return this.title(windowInfo, app);
    }
  }

  static title(windowInfo: WindowInfo, app: AppData) {
    switch (app.id) {
      case "arcbrowser":
      case "brave":
      case "canva":
      case "chrome":
      case "firefox":
      case "notes":
      case "safari":
      case "safaripreview":
      case "xcode":
      case "microsoft_edge":
        return `${app.id} should never use window title as entity`;
      case "figma": {
        const title = windowInfo.title.split(" - ")[0];
        if (!title || title === "Figma" || title === "Drafts") {
          return null;
        }
        return title;
      }
      case "warp": {
        const title = windowInfo.title.split(" - ")[0];
        if (!title || title === "Wrap") {
          return null;
        }
        return title;
      }
      case "postman": {
        const title = windowInfo.title.split(" - ")[0];
        if (!title || title === "Postman") {
          return null;
        }
        return title;
      }
      default:
        return windowInfo.title.split(" - ")[0];
    }
  }

  private static domainFromUrl(url: string) {
    const { host, port } = new URL(url);
    const domain = host.replace(/^www./, "");
    if (port) {
      return `${domain}:${port}`;
    }
    return domain;
  }
}
