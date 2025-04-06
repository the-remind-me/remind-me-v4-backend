# Use Node.js LTS image as the base
FROM oven/bun:alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package.json ./
RUN bun i

# Copy application code
COPY . .

# Create uploads directory for PDF storage
RUN mkdir -p uploads && chmod 777 uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app will run on
EXPOSE 5000

# Command to run the application
CMD ["bun","run", "index.js"]
