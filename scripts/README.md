`icon.svg` is the source for the app icons in `public/icons/`. Regenerate with:

```bash
for s in 192 512; do rsvg-convert -w $s -h $s scripts/icon.svg -o public/icons/icon-$s.png; done
rsvg-convert -w 180 -h 180 scripts/icon.svg -o public/icons/apple-touch-icon.png
```

Desktop icons (`src-tauri/icons/`):

```bash
rsvg-convert -w 1024 -h 1024 scripts/icon.svg -o scripts/icon-1024.png
cd src-tauri && npx tauri icon ../scripts/icon-1024.png -o icons && rm -rf icons/android icons/ios
```
