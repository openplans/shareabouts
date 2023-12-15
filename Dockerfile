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

# Expose the port the app runs on
ENV PORT=8000
EXPOSE $PORT

# Start the web server with gunicorn
CMD ["/bin/bash", "-c", "gunicorn -b 0.0.0.0:$PORT -w 4 project.wsgi"]
