FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Expose port 5173
EXPOSE 5173

# Host flag is required for Docker
CMD ["npm", "run", "dev", "--", "--host"]
