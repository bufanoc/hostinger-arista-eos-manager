# Arista EOS Manager - Deployment Guide for Ubuntu 22.04.5

This guide provides instructions on how to deploy the Arista EOS Manager web application on a fresh Ubuntu 22.04.5 server.

---

### Recommended: Automated Installation Script

For a fast and easy setup, use the provided `install.sh` script. It automates all dependency installation, application setup, and web server configuration.

**How to Use:**

1.  **Export Your Project Code**
    *   Click the **'Hostinger Horizons'** dropdown menu at the top-left of your screen.
    *   Select **'Export Code'**. This will download a `.zip` file of your entire application.

2.  **Upload the project to your server.**
    *   Unzip the downloaded file on your local machine.
    *   Use `scp` or `rsync` to copy the entire project folder to your server (e.g., into your home directory).
    ```bash
    # Example from your local machine:
    # Replace /path/to/local/project with the actual path on your computer
    scp -r /path/to/local/hostinger-arista-eos-manager your_username@your_server_ip:~/
    ```

3.  **Connect to your server and run the script:**
    Log in via SSH, navigate into the uploaded project folder, and execute the script with `sudo`.
    ```bash
    ssh your_username@your_server_ip
    cd hostinger-arista-eos-manager # Navigate into the directory you uploaded
    chmod +x install.sh
    sudo ./install.sh
    ```

4.  **Follow the on-screen prompt:**
    The script will ask for your domain name. You can enter one, or simply press `Enter` to have the site served directly from your server's IP address.

That's it! After the script finishes, your application will be deployed, running, and configured to start automatically on system reboots.

---

### Manual Installation Guide

If you prefer to install the application manually, follow the steps below.

### Prerequisites

- A server running Ubuntu 22.04.5.
- A non-root user with `sudo` privileges.
- A domain name pointing to your server's public IP address (optional, but recommended for production).
- The project files uploaded to your server.

---

### Step 1: Server Preparation

First, connect to your server via SSH and update the package lists and installed packages to their latest versions.

```bash
sudo apt update && sudo apt upgrade -y
```

Install Nginx (our web server), Git, and cURL.

```bash
sudo apt install nginx git curl -y
```

Next, configure the firewall to allow HTTP and HTTPS traffic.

```bash
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Check the status to ensure it's active and running.
```bash
sudo ufw status
```

---

### Step 2: Install Node.js (Version 20)

We will use `nvm` (Node Version Manager) to install and manage Node.js.

Download and run the `nvm` installation script.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

To start using `nvm`, you need to source your shell's configuration file.

```bash
source ~/.bashrc
```

Now, install Node.js version 20.

```bash
nvm install 20
```

Verify the installation by checking the versions.

```bash
node -v
npm -v
```

---

### Step 3: Deploy the Application

Create a directory where your application files will live.

```bash
sudo mkdir -p /var/www/arista-manager
sudo chown $USER:$USER /var/www/arista-manager
```

Copy your project files (which you should have already uploaded to your server) into this new directory.

```bash
# Example: rsync from your home directory to the deployment directory
rsync -a ~/hostinger-arista-eos-manager/ /var/www/arista-manager/
```

Navigate into the project directory.

```bash
cd /var/www/arista-manager
```

Install the project dependencies and build the application for production.

```bash
npm install
npm run build
```

---

### Step 4: Configure Nginx to Serve the Application

Create a new server block configuration file for our application.

```bash
sudo nano /etc/nginx/sites-available/arista-manager
```

Paste the following configuration into the file. Replace `your_domain.com` with your domain, or use `_` as the `server_name` to serve from the IP address.

```nginx
server {
    listen 80;
    server_name your_domain.com;

    root /var/www/arista-manager/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable this new server block and restart Nginx.

```bash
sudo ln -s /etc/nginx/sites-available/arista-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

To ensure Nginx starts on boot:
```bash
sudo systemctl enable nginx
```

Your application should now be live.

---

### Step 5: (Optional) Secure Your Site with HTTPS using Certbot

For a production environment, it is highly recommended to secure your site with a free SSL certificate from Let's Encrypt.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com
```

Follow the on-screen prompts. Certbot will handle the rest.

---

Congratulations! Your Arista EOS Manager is now deployed and ready to use.
