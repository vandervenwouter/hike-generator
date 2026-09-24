<h1 align="center">Hike Generator</h1>

<img src="assets/hike-generator-banner.png" alt="Hike Generator">

Create clear, illustrated hiking routes for scouts, walking groups, and
outdoor activities. Hike Generator helps you build a route step by step and
turns it into a printable A4 route sheet.

[Open the live app →](https://vandervenwouter.github.io/hike-generator/)

## At a glance

- Easily draw junctions, or insert a route instruction using different route-techniques.
- Add comments or add landmarks.
- Save as a polished route as an A4 PDF, or use JSON based import and export feature.
- Available in Dutch and English

The app runs directly in the browser and is designed to turn a route idea into
a practical route sheet quickly.

## Local development

Run `npm run dev` and open [the local preview](http://127.0.0.1:4173/).
Run `npm test` to check the app.

Each Vue component lives in `dist/components/`. `dist/app.js` imports and mounts
the root component; shared drawing and icon helpers live in `dist/diagrams.js`
and `dist/icons.js`. The browser loads these modules directly, with no build step.
