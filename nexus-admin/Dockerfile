# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:8080/api/v1
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
# Use lockfile when available; fall back to install otherwise
RUN if [ -f package-lock.json ]; then npm ci --no-progress; else npm install --no-progress; fi
COPY . .
RUN npm run build

# Stage 2: serve static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
