#!/bin/bash

echo "Checking for processes on development ports..."

# Kill process on port 8081 (Expo dev server)
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "Killing process on port 8081 (Expo dev server)..."
    lsof -ti:8081 | xargs kill -9
    echo "Port 8081 freed"
else
    echo "Port 8081 is already free"
fi

# Kill process on port 4983 (Drizzle Studio)
if lsof -Pi :4983 -sTCP:LISTEN -t >/dev/null ; then
    echo "Killing process on port 4983 (Drizzle Studio)..."
    lsof -ti:4983 | xargs kill -9
    echo "Port 4983 freed"
else
    echo "Port 4983 is already free"
fi

# Kill process on port 9200 (Backend Server)
if lsof -Pi :9200 -sTCP:LISTEN -t >/dev/null ; then
    echo "Killing process on port 9200 (Backend Server)..."
    lsof -ti:9200 | xargs kill -9
    echo "Port 9200 freed"
else
    echo "Port 9200 is already free"
fi

echo "Ready to start development servers!"
