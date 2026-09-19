# hike-generator

## Local development

Run the static app locally:

```sh
npm run dev
```

Open <http://127.0.0.1:4173>. Run the checks with:

```sh
npm test
```

## GitHub Pages

The GitHub Pages workflow deploys only `dist/` from `main`, so the source repository and the hosted files stay together. In the repository settings, choose **Settings → Pages → Build and deployment → Source → GitHub Actions**.

The deployed app is intended to be available at <https://vandervenwouter.github.io/hike-generator/>.
