# --- Stage 1: Build the React/Vite application ---
FROM node:20-alpine as builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (using --force in case of peer dependency issues)
RUN npm install --force

# Copy the rest of the application source code
COPY . .

# Build the application for production
# This command typically creates a 'dist' directory with static files
RUN npm run build


# --- Stage 2: Serve the built application with Nginx ---
FROM nginx:alpine as production

# Copy the custom Nginx configuration file
# This file is needed to handle client-side routing (e.g., for React Router)
# We will assume a simple default.conf setup for single-page applications (SPA).
# If you need a custom Nginx config, create it in your project root.
# For simplicity, we'll use a generic config snippet.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application files from the builder stage into Nginx's HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port Nginx is listening on
EXPOSE 80

# The default Nginx CMD will run, starting the web server.
CMD ["nginx", "-g", "daemon off;"]
