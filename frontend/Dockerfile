FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server (uses ~200-400MB less RAM than dev mode)
CMD ["npm", "start"]
