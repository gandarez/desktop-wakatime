# desktop-wakatime

Desktop system tray app for automatic time tracking and metrics generated from your app usage activity.

## Install

Coming Soon...

## Usage

Keep the app running in your system tray, and your app usage will show on your [WakaTime dashboard][dashboard].

## Local Development Setup

```
git clone git@github.com:wakatime/desktop-wakatime.git
cd desktop-wakatime
npm i
npm run dev
```

## Generate Release

To create a release build for the platform you are currently using, run the following command:

```
npm run build
```

Once the build completes, you will find the installer file at the following path:

```
/release/[Version]/Wakatime-[Platform]-[Version]-Installer.[Extension]
```

## Supported Apps

Before requesting support for a new app, first check the [list of supported apps][supported apps].

Made with :heart: by the WakaTime Team.

[api key]: https://wakatime.com/api-key
[dashboard]: https://wakatime.com/
[supported apps]: https://github.com/wakatime/desktop-wakatime/blob/80fba053a1334f22f08c4d0b069be4951d15de95/electron/watchers/apps.ts#L3
