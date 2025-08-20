#!/bin/bash

# Clinic Appointment Booking App - Deployment Script
# This script helps deploy the app to various platforms

echo "🚀 Clinic Appointment Booking App - Deployment Script"
echo "=================================================="

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ Requirements met"
}

# Build the application
build_app() {
    echo "Building application..."
    
    # Install dependencies
    echo "Installing dependencies..."
    npm run install-all
    
    # Build frontend
    echo "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    echo "✅ Build completed"
}

# Deploy to Vercel (Frontend)
deploy_vercel() {
    echo "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    cd frontend
    vercel --prod
    cd ..
    
    echo "✅ Frontend deployed to Vercel"
}

# Deploy to Netlify (Frontend)
deploy_netlify() {
    echo "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    cd frontend
    netlify deploy --prod --dir=dist
    cd ..
    
    echo "✅ Frontend deployed to Netlify"
}

# Deploy to Render (Backend)
deploy_render() {
    echo "Deploying to Render..."
    echo "Please follow these steps:"
    echo "1. Go to https://render.com"
    echo "2. Create a new Web Service"
    echo "3. Connect your GitHub repository"
    echo "4. Set build command: npm install"
    echo "5. Set start command: npm start"
    echo "6. Set environment variables:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - FRONTEND_URL"
    echo "   - NODE_ENV=production"
    echo "7. Deploy!"
}

# Deploy to Railway (Backend)
deploy_railway() {
    echo "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    cd backend
    railway login
    railway init
    railway up
    cd ..
    
    echo "✅ Backend deployed to Railway"
}

# Setup MongoDB Atlas
setup_mongodb() {
    echo "Setting up MongoDB Atlas..."
    echo "Please follow these steps:"
    echo "1. Go to https://mongodb.com/atlas"
    echo "2. Create a free account"
    echo "3. Create a new cluster (free tier)"
    echo "4. Create a database user"
    echo "5. Get your connection string"
    echo "6. Update your .env file with MONGODB_URI"
}

# Main menu
main_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Build application"
    echo "2) Deploy frontend to Vercel"
    echo "3) Deploy frontend to Netlify"
    echo "4) Deploy backend to Render"
    echo "5) Deploy backend to Railway"
    echo "6) Setup MongoDB Atlas"
    echo "7) Full deployment (Build + Deploy)"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            check_requirements
            build_app
            ;;
        2)
            check_requirements
            build_app
            deploy_vercel
            ;;
        3)
            check_requirements
            build_app
            deploy_netlify
            ;;
        4)
            deploy_render
            ;;
        5)
            check_requirements
            deploy_railway
            ;;
        6)
            setup_mongodb
            ;;
        7)
            check_requirements
            build_app
            echo ""
            echo "Choose deployment platform:"
            echo "1) Vercel + Render"
            echo "2) Netlify + Railway"
            read -p "Enter choice (1-2): " platform
            
            case $platform in
                1)
                    deploy_vercel
                    deploy_render
                    ;;
                2)
                    deploy_netlify
                    deploy_railway
                    ;;
                *)
                    echo "Invalid choice"
                    ;;
            esac
            ;;
        8)
            echo "Goodbye! 👋"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
}

# Run main menu
main_menu
