#!/bin/bash

# Setup script for Openwhyd Node.js application
set -e

echo "🔧 Setting up Openwhyd development environment..."

# Update system packages
sudo apt-get update

# Install Node.js v24.22.1 using n (Node.js version manager)
echo "📦 Installing Node.js v24.22.1..."
sudo apt-get install -y curl
curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
sudo bash n 24.22.1
sudo rm n

# Add Node.js to PATH and refresh environment
echo 'export PATH="/usr/local/bin:$PATH"' >> $HOME/.profile
export PATH="/usr/local/bin:$PATH"
hash -r

# Verify Node.js version
node_version=$(node --version)
echo "✅ Node.js version: $node_version"

# Install additional dependencies
echo "📦 Installing additional dependencies..."
sudo apt-get install -y make build-essential python3 g++ gcc libc6-dev graphicsmagick netcat wget gnupg

# Install libssl1.1 for MongoDB compatibility
echo "📦 Installing libssl1.1 for MongoDB..."
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb
sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb

# Install MongoDB 5.0 (compatible with Ubuntu 22.04)
echo "📦 Installing MongoDB 5.0..."
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Create MongoDB directories
sudo mkdir -p /var/lib/mongodb-test
sudo mkdir -p /var/log/mongodb
sudo useradd -r -s /bin/false mongodb || true
sudo chown mongodb:mongodb /var/lib/mongodb-test
sudo chown mongodb:mongodb /var/log/mongodb

# Create MongoDB config for test instance
sudo tee /etc/mongod-test.conf > /dev/null << EOF
storage:
  dbPath: /var/lib/mongodb-test
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod-test.log

net:
  port: 27117
  bindIp: 127.0.0.1

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod-test.pid
EOF

# Create PID directory
sudo mkdir -p /var/run/mongodb
sudo chown mongodb:mongodb /var/run/mongodb

# Start MongoDB test instance
echo "🚀 Starting MongoDB on port 27117..."
sudo -u mongodb mongod --config /etc/mongod-test.conf

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Verify MongoDB is running
for i in {1..30}; do
    if nc -z localhost 27117; then
        echo "✅ MongoDB is running on port 27117"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MongoDB failed to start on port 27117"
        exit 1
    fi
    sleep 1
done

# Navigate to workspace
cd /mnt/persist/workspace

# Clean any existing node_modules and package-lock
echo "🧹 Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install --prefer-offline --no-audit

# Build the application
echo "🔨 Building application..."
npm run build

# Create environment files for testing
echo "📝 Setting up environment files..."

# Create env-vars-testing-local.sh if it doesn't exist
if [ ! -f env-vars-testing-local.sh ]; then
    cat > env-vars-testing-local.sh << 'EOF'
. ./env-vars-testing.sh
export MONGODB_PORT=27117
EOF
fi

# Create .env-local if it doesn't exist (referenced by env-vars-testing-local.sh)
if [ ! -f .env-local ]; then
    touch .env-local
fi

# Set environment variables for database initialization
export MONGODB_HOST=localhost
export MONGODB_PORT=27117
export MONGODB_DATABASE=openwhyd_test
export MONGODB_URL=mongodb://localhost:27117/openwhyd_test

# Initialize test database
echo "🗄️ Initializing test database..."
node test/reset-test-db.js

echo "✅ Setup complete! Environment is ready for testing."