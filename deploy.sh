#!/bin/bash

# Bookshop Management System Deployment Script
# This script helps deploy the application to various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Deploy backend
    cd backend
    if [ ! -f .env ]; then
        print_warning "Creating .env file from example..."
        cp env.example .env
    fi
    
    print_status "Deploying backend to Railway..."
    railway up
    
    cd ..
    print_success "Backend deployed to Railway!"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy frontend
    cd frontend
    if [ ! -f .env.production ]; then
        print_warning "Creating .env.production file..."
        cp env.production.example .env.production
    fi
    
    print_status "Deploying frontend to Vercel..."
    vercel --prod
    
    cd ..
    print_success "Frontend deployed to Vercel!"
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    print_status "Building and starting containers..."
    docker-compose up -d --build
    
    print_success "Application deployed with Docker!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
    print_status "Database: localhost:5432"
}

# Deploy to local environment
deploy_local() {
    print_status "Deploying locally..."
    
    # Install backend dependencies
    cd backend
    print_status "Installing backend dependencies..."
    npm install
    
    # Set up environment
    if [ ! -f .env ]; then
        print_warning "Creating .env file from example..."
        cp env.example .env
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npm run db:generate
    
    cd ..
    
    # Install frontend dependencies
    cd frontend
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
    
    print_success "Local deployment setup complete!"
    print_status "To start the application:"
    print_status "1. Start backend: cd backend && npm run dev"
    print_status "2. Start frontend: cd frontend && npm run dev"
}

# Main deployment function
main() {
    echo "🚀 Bookshop Management System Deployment Script"
    echo "=============================================="
    echo ""
    
    # Check requirements
    check_requirements
    
    # Parse command line arguments
    case "${1:-}" in
        "railway")
            deploy_railway
            ;;
        "vercel")
            deploy_vercel
            ;;
        "docker")
            deploy_docker
            ;;
        "local")
            deploy_local
            ;;
        "all")
            deploy_railway
            deploy_vercel
            ;;
        *)
            echo "Usage: $0 {railway|vercel|docker|local|all}"
            echo ""
            echo "Options:"
            echo "  railway  - Deploy backend to Railway"
            echo "  vercel   - Deploy frontend to Vercel"
            echo "  docker   - Deploy using Docker Compose"
            echo "  local    - Set up local development environment"
            echo "  all      - Deploy both backend and frontend"
            echo ""
            echo "Examples:"
            echo "  $0 railway    # Deploy backend to Railway"
            echo "  $0 vercel     # Deploy frontend to Vercel"
            echo "  $0 docker     # Deploy with Docker"
            echo "  $0 local      # Set up local environment"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"













