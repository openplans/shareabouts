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

# # Copy the node.js dependencies and postinstall results to the working directory
# COPY --from=nodejs /app/node_modules /app/node_modules
# COPY --from=nodejs /app/package.json /app/package.json
# COPY --from=nodejs /app/package-lock.json /app/package-lock.json

# Copy the rest of the application code to the working directory
COPY src .

# Expose the port the app runs on
EXPOSE 8000

# Start the web server with gunicorn
# gunicorn src.project.wsgi -b 0.0.0.0:$PORT -w 4
CMD ["gunicorn", "-b", "0.0.0.0:8000", "-w", "4", "project.wsgi"]
