# backend/Dockerfile
# Use the official Node image as the base image
FROM node:lts-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the rest of the application source code
# We assume dependencies were installed during the build stage in Jenkins, 
# but they need to be installed again in the final image, or copied from the workspace.
# For simplicity, let's copy the entire backend folder contents.
COPY . .

# Install production dependencies (if not done in Jenkins)
# Since Jenkins ran 'npm install', we can skip this here if we copy node_modules,
# but using npm ci is safer in the Docker build context.
# RUN npm ci --only=production
RUN npm install 

# Expose the port the app runs on (e.g., 5000)
EXPOSE 5000

# Define the command to run the application
CMD ["npm", "start"]
