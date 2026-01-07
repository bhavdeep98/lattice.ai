#!/bin/bash

echo "🚀 Starting Real Lattice Demo"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "lattice-demo-backend.js" ]; then
    echo "❌ Please run this script from the website directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend
echo "🔧 Starting Lattice demo backend..."
echo "📍 Backend will run on: http://localhost:3001"
echo "🌐 Frontend available at: http://localhost:8001/real-lattice-demo.html"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

node lattice-demo-backend.js