# Use a lightweight Node.js image
FROM node:18-alpine
# Create app directory
WORKDIR /app
# Copy package files first for efficient caching
COPY package*.json ./
# Install only production dependencies
RUN npm install --production
# Copy the rest of your app’s source code
COPY . .
EXPOSE 5001
ENV NODE_ENV=production
# Start your app
CMD ["node", "server.js"]

