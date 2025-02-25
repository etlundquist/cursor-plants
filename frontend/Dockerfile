FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-package-lock && \
    npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps --no-package-lock

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production environment
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Add nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]