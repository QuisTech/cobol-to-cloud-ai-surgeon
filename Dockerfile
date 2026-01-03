# Use Node.js
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install a simple HTTP server
RUN npm install -g http-server

# Expose port
EXPOSE 8080

# Serve the built files
CMD ["http-server", "dist", "-p", "8080", "-a", "0.0.0.0"]
