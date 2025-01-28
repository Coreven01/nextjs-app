# Use the latest LTS version of Node.js with Alpine as the base image
FROM node:22-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (or package-lock.json if present)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application files
COPY . .

RUN pnpm build

# Expose the port your app will run on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
