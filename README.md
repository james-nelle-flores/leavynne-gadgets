# Leavynne Gadgets — Website & Inventory System

Static website (HTML, CSS, JavaScript). No build step.

## Run locally
Double-click `index.html`.

## Deploy (Vercel)
Import this GitHub repository in Vercel → Framework Preset: **Other** → Deploy.
Leave Build Command and Output Directory empty.

## Staff login
- First owner sign-in: `owner` / `Leavynne2026` (must be changed on first sign-in)
- Staff invite code: `LG-STAFF-2026` (`staffCode` in `js/data.js`)

Accounts, stock and inquiries are stored in each visitor's browser (localStorage).

## Product images
`images/<product>.webp` is the main image. Extra colors are listed in `colorImages` in `js/data.js`.
Colors without an image show a drawing in that color.
