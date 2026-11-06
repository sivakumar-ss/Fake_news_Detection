# FakeNewsDetect — Frontend

React 19 + Vite client for the Fake News Detection application.

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview the production build
```

## Configuration

Copy `.env.example` to `.env`. The only frontend setting is
`VITE_API_BASE_URL`, which points Axios at the Flask API.

> Anything prefixed with `VITE_` is embedded in the browser bundle. Never put
> an API key or any other secret in this application.

## Structure

```
src/
  components/   Layout, Navbar, Footer, StatusBadge
  pages/        Home, Detect, History, About, NotFound
  services/     Axios instance and API calls
  styles/       Design tokens, shared styles, page styles
  assets/       Logo and static assets
```

The backend lives in `../backend`. See the root `README.md` for full setup
instructions.
