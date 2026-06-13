#!/bin/bash
# JBSS Dress Search - Setup & Run Script
set -e

cd "$(dirname "$0")"

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "============================================"
echo "  Setup complete! Starting the server..."
echo "  Open http://localhost:5000 in your browser"
echo "============================================"
echo ""

python app.py
