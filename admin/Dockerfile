# admin/Dockerfile

# Stage 1: Build the application
FROM node:lts-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the production assets
RUN npm run build


# Stage 2: Serve the application using Nginx
FROM nginx:alpine as production

# Copy the built assets from the builder stage to the Nginx content directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom Nginx config if needed, otherwise rely on default Nginx behavior
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
