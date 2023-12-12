### Layer 1 -- Node.js
### ==================

# Use an official Node.js runtime as a parent image
FROM node:18 as nodejs

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies and run postinstall script
RUN npm install
RUN npm run postinstall

### Layer 2 -- Python
### =================

# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory to /app
WORKDIR /app

# Copy the dependencies file to the working directory
COPY app-requirements.txt .
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY src .

# Install NGINX
RUN apt-get update && apt-get install -y nginx

# Set environment variables
ENV NGINX_PORT=8000
ENV GUNICORN_PORT=8001

# Expose the ports
EXPOSE $NGINX_PORT $GUNICORN_PORT

# NGINX configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Start NGINX for serving static files and Gunicorn for other traffic
CMD nginx && gunicorn -b 0.0.0.0:$GUNICORN_PORT -w 4 project.wsgi
