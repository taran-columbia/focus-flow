# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine AS runtime

# Vite outputs to /app/dist by default
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: SPA routing support (React Router)
# If you are NOT using client-side routing, you can remove this.
RUN printf '%s\n' \
'server {' \
'  listen 80;' \
'  server_name _;' \
'  root /usr/share/nginx/html;' \
'  index index.html;' \
'  location / {' \
'    try_files $uri $uri/ /index.html;' \
'  }' \
'}' \
> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
