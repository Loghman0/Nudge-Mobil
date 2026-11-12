# Nudge opening motion

The existing app mark sits centered on the mist surface (#edf2f7). Two paper shapes (#f9fbfd and #e1eaf4) slide into alignment behind the blue mark (#355db9). The wordmark appears in the app's system typeface and ink (#253348). The motion comes from gathering separate answers into one place. It uses the same visual language as the question cards and has no instructional copy.

```
       [ offset pages ]
             [n]
            Nudge
```

The opening lasts about 800 ms when motion is enabled, with a static brand state while startup work is pending. Reduced Motion shows the still mark until the content is ready. The animation is rendered locally with opacity and transforms. It does not need a video decoder, a network request, or a new native module.

A cold launch starts here. A return after 15 minutes in the background plays it again and takes the signed-in user to Today. Short switches retain their screen. The normal Android lifecycle remains in control of the process, and the return leaves saved answers, accounts, and persisted decision drafts intact. An incoming notification target takes precedence over Today.

0.9.1 (version code 11) was built as a standalone Android preview. The 42,759,442-byte universal APK has SHA-256 `61d6bc81e2808c8d31efb69bbdf7818df374e9ea6ab7274824f04ed502accc66`. APK signature, 16KB ZIP and ELF alignment, and 93 native tests passed. The emulator ran the exact APK through a cold opening, six onboarding answers, and a short background return that preserved question six. The 15-minute cutoff is covered by the launch policy test. Physical-phone receipt and signed-in acceptance still need device testing.

Actual emulator capture: `mobile/design/evidence/nudge-opening-0.9.1.png` and `mobile/design/evidence/nudge-opening-0.9.1.mp4`.
