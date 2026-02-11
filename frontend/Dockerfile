# Stage 1: Build React
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure build uses production env
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy build files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]