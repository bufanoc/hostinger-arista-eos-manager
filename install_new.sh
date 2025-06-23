#!/bin/bash

set -e

echo "🚀 Starting Arista EOS Manager Deployment..."
echo "This script automates the full installation on Ubuntu 22.04.5"
echo "It must be run from within the project's root directory."
echo ""

if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Please use 'sudo ./install_new.sh'" 
   exit 1
fi

# Get server IP and domain information
SERVER_IP=$(hostname -I | awk '{print $1}')
read -p "Enter your domain name (or press Enter to use server IP: $SERVER_IP): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME=$SERVER_IP
    echo "✓ Using server IP address for access."
fi

echo ""
echo "✅ Starting installation for '$DOMAIN_NAME'..."
echo ""

# Step 1: System updates and dependencies
echo "⚙️ [1/5] Installing system dependencies..."
apt update
apt install -y nginx curl

# Install Node.js 20.x from NodeSource repository
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "✓ Dependencies installed."
echo ""

# Step 2: Configure firewall
echo "# Firewall configuration has been removed as per user request"
echo "# UFW is not enabled to prevent blocking SSH and other ports"
echo ""

# Step 3: Set up application directory
echo "📦 [3/5] Setting up application directory..."
APP_DIR="/var/www/arista-manager"
mkdir -p $APP_DIR

# Get current non-root user info
SUDO_USER_NAME=${SUDO_USER:-$(who -u | awk '{print $1}' | head -1)}
if [ -z "$SUDO_USER_NAME" ]; then
    echo "❌ Could not find a non-root user. Please create one and re-run."
    exit 1
fi

# Copy application files
chown -R $SUDO_USER_NAME:$SUDO_USER_NAME $APP_DIR
SCRIPT_DIR=$(pwd)
rsync -a --delete --chown=$SUDO_USER_NAME:$SUDO_USER_NAME --exclude '.git' --exclude 'node_modules' --exclude 'install.sh' "$SCRIPT_DIR/" "$APP_DIR/"

# Build application
echo "Building application..."
cd $APP_DIR
sudo -u $SUDO_USER_NAME npm install
sudo -u $SUDO_USER_NAME npm run build

echo "✓ Application deployed and built."
echo ""

# Step 4: Configure Nginx
echo "🌐 [4/5] Configuring Nginx..."
NGINX_CONFIG_FILE="/etc/nginx/sites-available/arista-manager"

NGINX_SERVER_NAME=$DOMAIN_NAME
if [[ "$DOMAIN_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # This is an IP address
    NGINX_SERVER_NAME="_";
fi

# Create Nginx configuration
cat > $NGINX_CONFIG_FILE << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name $NGINX_SERVER_NAME;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site configuration
ln -sf $NGINX_CONFIG_FILE /etc/nginx/sites-enabled/
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# Test Nginx config
nginx -t

echo "✓ Nginx configured."
echo ""

# Step 5: Start services
echo "🚀 [5/5] Starting services..."
systemctl enable nginx
systemctl restart nginx
echo "✓ Services started."
echo ""

# Installation complete
echo "🎉 Installation Complete! 🎉"
echo ""
echo "The Arista EOS Manager is now accessible at: http://$DOMAIN_NAME"
echo "The application will automatically start when the server reboots."
echo ""

if [[ ! "$DOMAIN_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Security Recommendation:"
    echo "Secure your site with an SSL certificate using Certbot:"
    echo "  sudo apt install certbot python3-certbot-nginx -y"
    echo "  sudo certbot --nginx -d $DOMAIN_NAME"
    echo ""
fi
