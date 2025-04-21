#!/bin/bash

# Reading Helper Launcher Script
echo "🚀 Starting Reading Helper..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "💡 Add your OpenAI API key to .env for AI-powered explanations"
fi

# Start the application
echo "✨ Launching Reading Helper..."
echo "📝 Press Cmd+Shift+E (Mac) or Ctrl+Shift+E (Windows/Linux) after highlighting text"
npm start
