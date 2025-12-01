#!/bin/bash

# AI Face Detection Service Startup Script
# This script ensures no port conflicts and provides clean startup

echo "🔍 Starting AI Face Detection Service..."
echo ""

# Kill any existing processes on port 5002-5012
for port in {5002..5012}; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "⚠️  Killing existing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null
    fi
done

# Wait a moment for ports to be released
sleep 1

# Activate virtual environment
if [ -d "venv" ]; then
    echo "✅ Activating virtual environment..."
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Please run: python3 -m venv venv"
    exit 1
fi

# Start the service
echo "🚀 Starting Face Detection Service..."
echo ""
python face_detection_service.py
