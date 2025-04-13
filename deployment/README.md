# Grapevine EC2 Server Setup Guide

This document provides step-by-step instructions for starting and connecting to the Grapevine EC2 server.

## Prerequisites

- AWS account credentials
- Access to the EC2 console
- SSH client installed on your machine
- The private key file (`grapevine_key.pem`) for SSH access

## Setup Instructions

### 1. Log into AWS Console

- Navigate to the [AWS Management Console](https://aws.amazon.com/console/)
- Sign in with your credentials
- Go to the EC2 service dashboard

### 2. Start the EC2 Instance

- Locate the "Grapevine Server" EC2 instance in your instances list
- Select the instance
- Click the "Instance state" dropdown and select "Start instance"
- Wait for the instance status to change to "Running"

### 3. Get the Public DNS

- Once the instance is running, select it from the instances list
- In the "Details" tab, locate and copy the "Public IPv4 DNS"
- **Important:** This DNS address will change each time the instance is restarted

### 4. SSH into the Instance

```bash
ssh -i /home/abindal/grapevine_key.pem ubuntu@<New-DNS-Here> -v
```

- Replace `<New-DNS-Here>` with the Public IPv4 DNS you copied in Step 3
- The `-v` flag enables verbose output for troubleshooting
- **Note:** It may take several minutes for the server to initialize after startup. If the connection fails, wait a few minutes and try again.

### 5. Run the Setup Script

Once connected via SSH, run the setup script:

```bash
./setup.sh
```

### 6. Test the Server

Send a curl request to confirm the server is functioning properly:

```bash
curl http://localhost:8080/health
```

## Troubleshooting

- If SSH connection fails, ensure:
  - The instance is in "Running" state
  - You're using the correct DNS address
  - The private key file has the correct permissions (run `chmod 400 grapevine_key.pem` if needed)
  - The server has had enough time to initialize

## Additional Information

- For security reasons, remember to stop the instance when not in use
- To stop the instance, select it in the EC2 console, click "Instance state" and select "Stop instance"

