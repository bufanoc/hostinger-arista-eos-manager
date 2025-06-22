#!/bin/bash

set -e

echo "🔄 Starting Arista EOS Manager Uninstallation..."
echo "This script will remove all components installed by the Arista EOS Manager."
echo ""

if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Please use 'sudo ./uninstall.sh'" 
   exit 1
fi

# Ask for confirmation
read -p "Are you sure you want to uninstall Arista EOS Manager? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo "⚙️ [1/4] Removing Nginx configuration..."
if [ -f /etc/nginx/sites-enabled/arista-manager ]; then
    rm -f /etc/nginx/sites-enabled/arista-manager
    echo "✓ Nginx site configuration removed."
else
    echo "⚠️ Nginx site configuration not found (already removed)."
fi

if [ -f /etc/nginx/sites-available/arista-manager ]; then
    rm -f /etc/nginx/sites-available/arista-manager
    echo "✓ Nginx site definition removed."
else
    echo "⚠️ Nginx site definition not found (already removed)."
fi

echo ""
echo "🗂️ [2/4] Removing application files..."
APP_DIR="/var/www/arista-manager"
if [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
    echo "✓ Application files removed."
else
    echo "⚠️ Application directory not found (already removed)."
fi

echo ""
echo "🔄 [3/4] Restarting Nginx..."
if systemctl is-active --quiet nginx; then
    systemctl restart nginx
    echo "✓ Nginx restarted."
else
    echo "⚠️ Nginx is not running."
fi

echo ""
echo "🧹 [4/4] Cleaning up symbolic links..."
if [ -L "/usr/local/bin/node" ] && [ ! -e "/usr/local/bin/node" ]; then
    rm -f /usr/local/bin/node
    echo "✓ Node.js symbolic link removed."
fi

if [ -L "/usr/local/bin/npm" ] && [ ! -e "/usr/local/bin/npm" ]; then
    rm -f /usr/local/bin/npm
    echo "✓ NPM symbolic link removed."
fi

echo ""
echo "🎉 Uninstallation Complete! 🎉"
echo ""
echo "The Arista EOS Manager has been successfully removed from your system."
echo ""
echo "Note: This script did not remove:"
echo "  - Nginx itself (in case you're using it for other applications)"
echo "  - Node.js/NVM installation (installed in user's home directory)"
echo "  - Any SSL certificates if you configured them"
echo ""
echo "If you want to completely remove Nginx, you can run:"
echo "  sudo apt-get purge nginx nginx-common -y"
echo "  sudo apt-get autoremove -y"
echo ""
