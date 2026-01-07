# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_BRIDGE_API_URL=http://localhost:8090/api/v1
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BRIDGE_API_URL=${VITE_BRIDGE_API_URL}
COPY package*.json ./
RUN npm ci --no-progress || npm install --no-progress
COPY . .
RUN npm run build

# Stage 2: serve static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
