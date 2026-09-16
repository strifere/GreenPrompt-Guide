# !/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Script that sets up your machine to run the web app in dev mode. It installs the necessary dependencies and starts the development server. This script is meant to be executed on a Debian based SO, with a 

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash

    # in lieu of restarting the shell
    \. "$HOME/.nvm/nvm.sh"

    # Download and install Node.js:
    nvm install node
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Installing npm..."
    # npm is included with Node.js, so if Node.js is installed, npm should be available. If not, you can install it using the following command:
    nvm install-latest-npm
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Installing Docker..."
    # Install Docker using the official convenience script
    # Add Docker's official GPG key:
    sudo apt update
    sudo apt install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources:
    sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Pull and run the latest Database and Ollama image from Docker Hub
cd "$SCRIPT_DIR/greenprompt-guide"
sudo docker compose up -d db ollama

# Install the necessary dependencies for the web app
npm install --ignore-scripts

# Generate schema and client for Prisma
npx --ignore-scripts prisma format    # Format the schema file
npx --ignore-scripts prisma validate  # Validate schema syntax
npx --ignore-scripts prisma generate  # Generate Prisma Client

# Push the schema to the database
npx --ignore-scripts prisma db push

# Start the development server
npm run dev
