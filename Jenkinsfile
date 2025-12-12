pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        
        FRONTEND_IMAGE = 'duskyguy/frontend-image'
        BACKEND_IMAGE = 'duskyguy/food-backend'
        
        DOCKER_CREDS = 'my-dockerhub-creds'     // DockerHub credentials ID.
        
        // -----------------------------------------------------------------
        // MODIFIED FOR GCP/GKE
        // -----------------------------------------------------------------
        GCP_CRED_ID = 'my-gcp-service-account'   // ID of the Jenkins File credential for your GCP Service Account Key (JSON file)
        GCP_PROJECT = 'your-gcp-project-id-here' // <<< CHANGE THIS to your GCP Project ID
        GCP_ZONE = 'us-central1-a'               // <<< CHANGE THIS to your GKE cluster's zone/region
        GKE_CLUSTER = 'food-delivery-cluster'    // <<< CHANGE THIS to your GKE cluster name
        // AWS variables REMOVED
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
                    sh(script: "docker pull ${FRONTEND_IMAGE}:latest", returnStatus: true)
                    def frontendExists = env.EXIT_STATUS
                    def dockerImageFrontend

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
                    sh(script: "docker pull ${BACKEND_IMAGE}:latest", returnStatus: true)
                    def backendExists = env.EXIT_STATUS
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
        
        // -----------------------------------------------------------------
        // NEW GKE DEPLOYMENT STAGE
        // -----------------------------------------------------------------
        stage('Deploy to GKE Kubernetes') {
            steps {
                script {
                    echo "🚢 Deploying application to Google Kubernetes Engine (GKE)..."
                    
                    // Securely load GCP Service Account Key file
                    withCredentials([file(credentialsId: "${GCP_CRED_ID}", variable: 'GCP_SA_KEY_FILE')]) {
                        
                        // Authenticate and configure kubectl for GKE cluster
                        sh "gcloud auth activate-service-account --key-file=\${GCP_SA_KEY_FILE}"
                        sh "gcloud container clusters get-credentials ${GKE_CLUSTER} --zone ${GCP_ZONE} --project ${GCP_PROJECT}"
                        
                        // Update the image tags in the manifest files
                        echo "Updating Kubernetes deployment manifests..."
                        sh "sed -i 's|DOCKER_IMAGE_FRONTEND_VERSION|${FRONTEND_IMAGE}:${BUILD_NUMBER}|g' k8s/frontend-deployment.yaml"
                        sh "sed -i 's|DOCKER_IMAGE_BACKEND_VERSION|${BACKEND_IMAGE}:${BUILD_NUMBER}|g' k8s/backend-deployment.yaml"
                        
                        echo "Applying new deployment to GKE cluster..."
                        // Apply the updated manifest files
                        sh "kubectl apply -f k8s/"
                    }
                    echo "Deployment completed."
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build, Push, and Deploy completed successfully!"
        }
        failure {
            echo "❌ Build/Push/Deploy failed. Check logs for details."
        }
    }
}
