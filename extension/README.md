# CursorKit for Chrome

Puts any CursorKit cursor on any site you visit, and lets you turn it off on the
ones where you would rather it did not.

## Install it locally

```bash
npm run extension
```

Then in Chrome: **chrome://extensions → Developer mode → Load unpacked →** pick
this `extension/` folder. Pin it and the popup is the builder.

`npm run extension` builds the engine and copies `dist/library.js` here as
`engine.js`. That copy is deliberate — the extension must run the exact bytes
the CDN serves, or a style that looks right here can look wrong on a real site.
`engine.js` is generated and git-ignored; run the command after pulling.

## How it is wired

| File | Job |
| --- | --- |
| `config.js` | The stored shape and its defaults. Loaded by both ends so they cannot drift. |
| `engine.js` | The whole library, registered but not booted. Generated. |
| `content.js` | Reads settings, boots the cursor, re-applies on change. |
| `popup.js` | The builder. Reads its lists off the engine, so a new style needs no edit here. |

Settings live in `chrome.storage.sync`, so they follow the Chrome profile rather
than the machine. The shape is one global config plus `off`, a list of hostnames
— "on everywhere except…" is the default, because the alternative is an
extension that appears to do nothing until you find the switch.

The popup boots a real cursor over itself rather than drawing a picture of one.
The control panel is marked `data-native` and keeps the system pointer, since
choosing a cursor is harder when the tool is wearing it.

## Permissions, and why

- **`storage`** — the settings.
- **`<all_urls>`** — the content script has to be able to run on whatever site
  you are looking at. This is the honest cost of "cursors on any site"; there is
  no narrower permission that delivers it.

Nothing is sent anywhere. There is no network code in the extension at all.

## Before publishing to the Web Store

The store listing needs a 128px icon (`icons/128.png`, already here), at least
one 1280×800 screenshot, a short and a long description, and a privacy
justification for `<all_urls>` — say that the content script draws the cursor and
that no page data is read or transmitted, which is true. A `$5` one-time
developer registration is required.
