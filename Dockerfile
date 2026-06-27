# Start from the base Node image needed for your application builds
FROM node:lts-slim

# Install necessary dependencies and the kubectl CLI (using a method similar to Option 1)
RUN apt-get update && \
    apt-get install -y curl apt-transport-https gnupg2 && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list && \
    apt-get update && \
    apt-get install -y kubectl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory (optional)
WORKDIR /home/jenkins/agent
