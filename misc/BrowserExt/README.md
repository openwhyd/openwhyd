# Browser Extensions

## Chrome extension

This extension, known as the "Openwhyd ✚ track" button, allows users to quickly add a track from any website.

### Installation & usage

You can install it from [its Chrome Web Store page](https://chromewebstore.google.com/detail/openwhyd-%E2%9C%9A-track/foohaghobcolamikniehcnnijdjehfjk).

See [video tutorial on how to install and use it](https://youtu.be/aZT8VlTV1YY?si=5FCf1LP4OXZvWhX6&t=321).

### Development

The extension is based upon `bookmarlet.js`.

To rebuild the extension:

```sh
$ make chrome-extension
```

Make sure that unit tests still pass:

```sh
$ npx mocha test/unit/bookmarklet-tests.js
```

### Release

In order to publish new versions on Chrome Web Store, follow [their publication process](https://developer.chrome.com/docs/webstore/publish).
