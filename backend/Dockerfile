# Use a glibc-based image (Debian)
FROM node:lts-slim

WORKDIR /usr/src/app

# 1. Install build essentials (needed to compile bcrypt on Debian)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy only dependency files first (better for Docker caching)
COPY package*.json ./

# 3. CRITICAL: Install dependencies fresh in this environment
# This ensures bcrypt is compiled for glibc/Debian
RUN npm install --production

# 4. Copy the rest of the app code (but NOT the existing node_modules)
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
