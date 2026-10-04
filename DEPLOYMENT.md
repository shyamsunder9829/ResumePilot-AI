# Deployment

The repository contains a Vite frontend and an Express API deployed separately:

- **Netlify** deploys `Frontend` using the root [`netlify.toml`](./netlify.toml).
- **Render** deploys `Backend` using the root [`render.yaml`](./render.yaml).

## Deploy the backend to Render

1. Create a new **Blueprint** in Render and select this repository. Render reads
   `render.yaml` and creates the backend web service.
2. Set the service environment variables:
   - `FRONTEND_URL`: the deployed Netlify site origin, for example
     `https://your-site.netlify.app` (no trailing slash).
     Netlify deploy-preview origins for this same site are also allowed.
   - `MONGO_URI`: the MongoDB connection string. Configure MongoDB Atlas network
     access to allow connections from Render.
   - `JWT_SECRET`: a long, random secret.
   - `GOOGLE_GENAI_API_KEY`: the Google GenAI API key.
3. Wait for the deployment health check at `/health` to pass and copy the
   service URL, for example `https://your-api.onrender.com`.

Do not commit `.env` files or put secrets in frontend environment variables.
Render injects its configured variables into the backend at runtime.

## Deploy the frontend to Netlify

1. Import this repository as a Netlify site. The root `netlify.toml` sets the
   frontend base directory, build command, and publish directory.
2. Add the environment variable `VITE_API_URL` with the full Render service URL,
   for example `https://your-api.onrender.com` (no trailing slash).
3. Trigger a deploy. Set this variable before building because Vite embeds
   `VITE_*` values in the generated frontend.

The Netlify redirect rule serves the React app for client-side routes.

## Local development

Copy `Frontend/.env.example` to `Frontend/.env` and
`Backend/.env.example` to `Backend/.env`, then fill in the backend secrets and
database URL. Start the backend with `npm run dev` from `Backend` and the
frontend with `npm run dev` from `Frontend`.
