# syntax=docker/dockerfile:1

FROM oven/bun:1.2-alpine AS build
WORKDIR /app
# Dependencies first: editing the app doesn't reinstall them.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# The image has no Node.js: --bun runs tsc and vite on Bun's runtime.
RUN bun --bun run build

FROM nginx:1.30.5-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
