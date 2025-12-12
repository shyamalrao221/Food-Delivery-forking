pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        
        FRONTEND_IMAGE = 'duskyguy/frontend-image'
        BACKEND_IMAGE = 'duskyguy/food-backend'
        
        DOCKER_CREDS = 'my-dockerhub-creds'  // DockerHub credentials ID.
        KUBECONFIG_CRED = 'kubeconfig-aws'
        AWS_CREDS = 'AWS-Credentials'
        AWS_REGION = 'ap-south-1'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "📥 Checking out repository..."
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Build & Tag Frontend Image') {
            steps {
                script {
                    echo "🔧 Checking if Frontend image ${FRONTEND_IMAGE}:latest exists on DockerHub..."
                    
                    // --- CORRECTED: Use 'sh' for Linux, captures exit status in env.EXIT_STATUS ---
                    sh(script: "docker pull ${FRONTEND_IMAGE}:latest", returnStatus: true)
                    def frontendExists = env.EXIT_STATUS
                    // -----------------------------------------------------------------------------

                    def dockerImageFrontend

                    // Docker pull returns 0 (success) if the image exists, and non-zero if it fails (doesn't exist).
                    if (frontendExists != 0) {
                        echo "🛠️ Building new Frontend Docker image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        dockerImageFrontend = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}", "./${FRONTEND_DIR}")
                        dockerImageFrontend.tag('latest')
                    } else {
                        echo "✅ Frontend image already exists. Skipping build."
                    }
                    env.DOCKER_IMAGE_FRONTEND = dockerImageFrontend
                }
            }
        }

        stage('Build & Tag Backend Image') {
            steps {
                script {
                    echo "🔧 Checking if Backend image ${BACKEND_IMAGE}:latest exists on DockerHub..."
                    
                    // --- CORRECTED: Use 'sh' for Linux, captures exit status in env.EXIT_STATUS ---
                    sh(script: "docker pull ${BACKEND_IMAGE}:latest", returnStatus: true)
                    def backendExists = env.EXIT_STATUS
                    // -----------------------------------------------------------------------------

                    def dockerImageBackend

                    if (backendExists != 0) {
                        echo "🛠️ Building new Backend Docker image: ${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        dockerImageBackend = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}", "./${BACKEND_DIR}")
                        dockerImageBackend.tag('latest')
                    } else {
                        echo "✅ Backend image already exists. Skipping build."
                    }
                    env.DOCKER_IMAGE_BACKEND = dockerImageBackend
                }
            }
        }

        stage('Push Images to DockerHub') {
            when {
                expression { env.DOCKER_IMAGE_FRONTEND != null || env.DOCKER_IMAGE_BACKEND != null }
            }
            steps {
                script {
                    echo "📦 Pushing Docker images to DockerHub..."
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS}") {
                        if (env.DOCKER_IMAGE_FRONTEND) {
                            echo "⬆️ Pushing Frontend images (${FRONTEND_IMAGE})..."
                            env.DOCKER_IMAGE_FRONTEND.push()
                            env.DOCKER_IMAGE_FRONTEND.push('latest')
                        } else {
                            echo "Frontend image not rebuilt. Skipping push."
                        }

                        if (env.DOCKER_IMAGE_BACKEND) {
                            echo "⬆️ Pushing Backend images (${BACKEND_IMAGE})..."
                            env.DOCKER_IMAGE_BACKEND.push()
                            env.DOCKER_IMAGE_BACKEND.push('latest')
                        } else {
                            echo "Backend image not rebuilt. Skipping push."
                        }
                    }
                }
            }
        }
        // NOTE: The 'Deploy' stage is missing from the original file, 
        // which is why the success message says deployment was skipped.
    }

    post {
        success {
            echo "✅ Build and Push completed successfully on localhost Jenkins! Deployment was skipped."
        }
        failure {
            // --- CORRECTED: Removed Windows-specific text ---
            echo "❌ Build/Push failed. Check logs for details. Remember to ensure Docker is running and the Jenkins user has Docker permissions."
        }
    }
}
