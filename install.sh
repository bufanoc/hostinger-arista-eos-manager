#!/bin/bash

set -e

echo "🚀 Starting Arista EOS Manager Deployment..."
echo "This script automates the full installation on a fresh Ubuntu 22.04.5 server."
echo "It must be run from within the project's root directory."
echo ""

if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Please use 'sudo ./install.sh'" 
   exit 1
fi

SERVER_IP=$(hostname -I | awk '{print $1}')
read -p "Enter your domain name (or press Enter to use the server IP: $SERVER_IP): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME=$SERVER_IP
    echo "✓ Using server IP address for access."
fi

echo ""
echo "✅ Starting installation for '$DOMAIN_NAME'..."
echo ""

echo "⚙️ [1/6] Updating system and installing dependencies (Nginx, cURL)..."
apt-get update && apt-get upgrade -y
apt-get install -y nginx curl
echo "✓ Dependencies installed."
echo ""

echo "🔥 [2/6] Configuring firewall to allow web traffic..."
ufw allow 'Nginx Full' > /dev/null
if ! ufw status | grep -q 'Status: active'; then
    ufw --force enable > /dev/null
fi
echo "✓ Firewall configured."
echo ""

echo "📦 [3/6] Installing Node.js v20..."
SUDO_USER_NAME=${SUDO_USER:-$(who -u | awk '{print $1}' | head -1)}
USER_HOME=$(getent passwd $SUDO_USER_NAME | cut -d: -f6)

if [ -z "$SUDO_USER_NAME" ] || [ -z "$USER_HOME" ]; then
    echo "❌ Could not find a non-root user. Please create one and re-run."
    exit 1
fi

echo "Installing NVM..."
sudo -u $SUDO_USER_NAME bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
echo "Installing Node.js v20..."
sudo -u $SUDO_USER_NAME bash -c 'export NVM_DIR="'$USER_HOME'/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm install 20'

NODE_PATH=$(find $USER_HOME/.nvm/versions/node -maxdepth 2 -type f -name "node")
NPM_PATH=$(find $USER_HOME/.nvm/versions/node -maxdepth 2 -type f -name "npm")
ln -sf $NODE_PATH /usr/local/bin/node
ln -sf $NPM_PATH /usr/local/bin/npm
echo "✓ Node.js v20 installed successfully."
echo ""

echo "🚚 [4/6] Deploying and building the application..."
APP_DIR="/var/www/arista-manager"
mkdir -p $APP_DIR
chown -R $SUDO_USER_NAME:$SUDO_USER_NAME $APP_DIR

SCRIPT_DIR=$(pwd)
rsync -a --delete --chown=$SUDO_USER_NAME:$SUDO_USER_NAME --exclude '.git' --exclude 'node_modules' --exclude 'install.sh' "$SCRIPT_DIR/" "$APP_DIR/"

echo "Building application. This may take a moment..."
echo "Installing npm dependencies and building the application..."
sudo -u $SUDO_USER_NAME bash -c "cd $APP_DIR && npm install && npm run build"
echo "✓ Application deployed and built."
echo ""

echo "🌐 [5/6] Configuring Nginx to serve the application..."
NGINX_CONFIG_FILE="/etc/nginx/sites-available/arista-manager"

NGINX_SERVER_NAME=$DOMAIN_NAME
if [[ "$DOMAIN_NAME" == "$SERVER_IP" ]]; then
    NGINX_SERVER_NAME="_";
fi

tee $NGINX_CONFIG_FILE > /dev/null &lt;&lt;EOF
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

ln -sf $NGINX_CONFIG_FILE /etc/nginx/sites-enabled/
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi
echo "✓ Nginx configured."
echo ""

echo "🚀 [6/6] Finalizing setup..."
nginx -t
systemctl enable nginx > /dev/null
systemctl restart nginx
echo "✓ Nginx service is enabled and running."
echo ""

echo "🎉 Deployment Complete! 🎉"
echo ""
echo "The Arista EOS Manager is now accessible at: http://$DOMAIN_NAME"
echo "The Nginx service is configured to start automatically on system boot."
echo ""
echo "Security Recommendation:"
echo "If you used a domain name, secure your site with an SSL certificate using Certbot:"
echo "  sudo apt install certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d $DOMAIN_NAME"
echo ""