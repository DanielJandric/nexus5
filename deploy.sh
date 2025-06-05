#!/bin/bash

# 🚀 Automated Cloud Deployment Script
# Supports Railway, Heroku, and Render

set -e

echo "🚀 Starting Cloud Deployment for Ticket System v3.0"
echo "=================================================="

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required, found: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    npm ci --only=production
    print_success "Dependencies installed"
}

# Generate secrets
generate_secrets() {
    print_status "Generating security secrets..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=$JWT_SECRET" >> .env.generated
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -hex 32)
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env.generated
    
    print_success "Security secrets generated in .env.generated"
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found, installing..."
        npm install -g @railway/cli
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        print_warning "Please login to Railway:"
        railway login
    fi
    
    # Deploy
    railway up
    
    print_success "Deployed to Railway!"
    print_status "Don't forget to set environment variables in Railway dashboard"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not found. Please install it first."
        exit 1
    fi
    
    # Check if logged in
    if ! heroku whoami &> /dev/null; then
        print_warning "Please login to Heroku:"
        heroku login
    fi
    
    # Create app if it doesn't exist
    read -p "Enter Heroku app name: " APP_NAME
    heroku create $APP_NAME || true
    
    # Add PostgreSQL addon
    heroku addons:create heroku-postgresql:mini -a $APP_NAME || true
    
    # Set environment variables
    heroku config:set NODE_ENV=production -a $APP_NAME
    heroku config:set INIT_DB=true -a $APP_NAME
    
    # Deploy
    git push heroku main
    
    print_success "Deployed to Heroku!"
}

# Build Docker image
build_docker() {
    print_status "Building Docker image..."
    
    docker build -t ticket-system:latest .
    
    print_success "Docker image built successfully"
    print_status "Run with: docker run -p 3000:3000 ticket-system:latest"
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment target:"
    echo "1) Railway (Recommended)"
    echo "2) Heroku"
    echo "3) Build Docker Image"
    echo "4) Generate Secrets Only"
    echo "5) Exit"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    
    while true; do
        show_menu
        read -p "Enter your choice [1-5]: " choice
        
        case $choice in
            1)
                install_dependencies
                generate_secrets
                deploy_railway
                break
                ;;
            2)
                install_dependencies
                generate_secrets
                deploy_heroku
                break
                ;;
            3)
                install_dependencies
                build_docker
                break
                ;;
            4)
                generate_secrets
                print_success "Secrets generated in .env.generated"
                break
                ;;
            5)
                print_status "Deployment cancelled"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
    done
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Set environment variables in your cloud platform dashboard"
    echo "2. Configure custom domain (optional)"
    echo "3. Set up monitoring and alerts"
    echo "4. Test your deployed application"
    echo ""
    echo "🔗 Useful Links:"
    echo "- Railway Dashboard: https://railway.app/dashboard"
    echo "- Heroku Dashboard: https://dashboard.heroku.com"
    echo "- Deployment Guide: ./DEPLOYMENT.md"
}

# Run main function
main "$@"

