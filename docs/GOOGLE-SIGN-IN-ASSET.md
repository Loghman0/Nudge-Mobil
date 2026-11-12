# Google sign-in detail — 9 November 2026

Native signup/sign-in and account reauthentication share `src/components/GoogleButton.tsx`. The preview still exposes this control only after six responses. Its visible action is **Continue with Google**; signing in still precedes the separate explicit account-save step. The button's accessible hint makes that sequence clear without adding visible copy.

The gradient Google G in `assets/google-g.png` is an unmodified official PNG from [Google's branding guide](https://developers.google.com/identity/branding-guidelines), downloaded directly from [the official asset URL](https://developers.google.com/static/identity/images/g-logo.png). Source URL, retrieval date, dimensions and SHA-256 are recorded in `assets/google-g.source.json`. Google retains its brand rights; this asset is used only to identify Google authentication.

The dedicated provider control uses a white surface, preserved logo aspect ratio, defined provider colors, a text label and a boundary. Touch height/width remain at least 48dp. Labels scale with system text, wrap instead of truncating, and remain available while the busy indicator is displayed. The decorative image and spinner do not become duplicate accessibility targets. Android's existing native font is retained rather than introducing a font/native dependency for this detail; this implementation is not a claim of completed Google brand verification.

The existing web shared Google control already renders a multicolor G and was left intact. No backend authentication setting, callback, credential or Google scope was changed. Source/type checks do not establish a real Google browser-return journey; that remains an explicit installed-device check.
