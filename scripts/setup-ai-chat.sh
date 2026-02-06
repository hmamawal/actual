#!/bin/bash

# AI Chat Setup Script for Actual Budget
# This script helps you quickly set up the OpenAI integration

set -e

echo "🤖 Setting up AI Chat Integration for Actual Budget"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Actual Budget root directory"
    exit 1
fi

# Navigate to desktop-client
cd packages/desktop-client

# Create .env.local if it doesn't exist
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Skipping creation."
else
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
fi

echo ""
echo "🔑 Next Steps:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/account/api-keys"
echo "2. Edit packages/desktop-client/.env.local"
echo "3. Replace 'your-openai-api-key-here' with your actual API key"
echo "4. Run 'yarn start' to launch the application"
echo ""
echo "📖 For more information, see:"
echo "   - AI_CHAT_SETUP.md (quick start)"
echo "   - packages/desktop-client/OPENAI_SETUP.md (detailed guide)"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "   - NEVER commit your .env.local file"
echo "   - NEVER share your API key publicly"
echo ""
echo "✨ Happy chatting with AI!"
