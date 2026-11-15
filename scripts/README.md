`icon.svg` is the source for the app icons in `public/icons/`. Regenerate with:

```bash
for s in 192 512; do rsvg-convert -w $s -h $s scripts/icon.svg -o public/icons/icon-$s.png; done
rsvg-convert -w 180 -h 180 scripts/icon.svg -o public/icons/apple-touch-icon.png
```
