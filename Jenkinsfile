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
        GCP_CRED_ID = 'my-gcp-service-account'   // ID of the Jenkins File credential (Secret File)
        GCP_PROJECT = 'ha-demo-480714'           // <<< CONFIRMED PROJECT ID
        GCP_ZONE = 'asia-south1-b'               // <<< CONFIRMED ZONE
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
    // Retain the 'when' condition
    when {
        expression { env.DOCKER_IMAGE_FRONTEND != null || env.DOCKER_IMAGE_BACKEND != null }
    }
    steps {
        script {
            echo "📦 Pushing Docker images to DockerHub..."
            
            // Use withDockerRegistry for login, but use sh for push.
            docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS}") {
                
                // Assuming you have defined FRONTEND_IMAGE_NAME and DOCKER_IMAGE_FRONTEND 
                // somewhere (even if they are currently null).
                def frontend_base = "${env.FRONTEND_IMAGE_NAME}"
                def frontend_tagged = "${env.DOCKER_IMAGE_FRONTEND}"
                def backend_base = "${env.BACKEND_IMAGE_NAME}"
                def backend_tagged = "${env.DOCKER_IMAGE_BACKEND}"

                if (frontend_tagged != 'null' && frontend_tagged != '') {
                    echo "⬆️ Pushing Frontend images (${frontend_base})..."
                    sh "docker push ${frontend_tagged}"            // e.g., duskyguy/frontend-image:16
                    sh "docker push ${frontend_base}:latest"       // e.g., duskyguy/frontend-image:latest
                } else {
                    echo "Frontend image name variable is empty/null. Skipping push."
                }

                if (backend_tagged != 'null' && backend_tagged != '') {
                    echo "⬆️ Pushing Backend images (${backend_base})..."
                    sh "docker push ${backend_tagged}"             // e.g., duskyguy/food-backend:16
                    sh "docker push ${backend_base}:latest"        // e.g., duskyguy/food-backend:latest
                } else {
                    echo "Backend image name variable is empty/null. Skipping push."
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
