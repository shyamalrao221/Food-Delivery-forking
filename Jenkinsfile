pipeline {
    agent any

    environment {
        GIT_REPO = 'https://github.com/JeevanKumar100/Food-Delivery-forking.git'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
        
        FRONTEND_IMAGE = 'duskyguy/frontend-image'
        BACKEND_IMAGE = 'duskyguy/food-backend'
        
        DOCKER_CREDS = 'my-dockerhub-creds'       // DockerHub credentials ID.
        
        // -----------------------------------------------------------------
        // MODIFIED FOR GCP/GKE
        // -----------------------------------------------------------------
        GCP_CRED_ID = 'my-gcp-service-account'   // ID of the Jenkins File credential (Secret File)
        GCP_PROJECT = 'ha-demo-480714'           // <<< CONFIRMED PROJECT ID
        GCP_ZONE = 'asia-south1-b'               // <<< CONFIRMED ZONE
        GKE_CLUSTER = 'food-delivery-cluster'    // <<< CHANGE THIS to your GKE cluster name
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
                    
                    // Use sh to execute docker pull and check exit status
                    sh(script: "docker pull ${FRONTEND_IMAGE}:latest", returnStatus: true)
                    def frontendExists = env.EXIT_STATUS
                    def dockerImageFrontend // Declared for scope

                    if (frontendExists != 0) {
                        echo "🛠️ Building new Frontend Docker image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                        
                        // 1. Build and create the Docker Object
                        dockerImageFrontend = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}", "./${FRONTEND_DIR}")
                        
                        // 2. Tag 'latest'
                        dockerImageFrontend.tag('latest')
                    } else {
                        echo "✅ Frontend image already exists. Skipping build. Will use existing tag: ${FRONTEND_IMAGE}:latest"
                        // 3. Mandatory: Create the object from the existing image so it can be pushed/used later
                        dockerImageFrontend = docker.image("${FRONTEND_IMAGE}:latest")
                    }
                    
                    // 4. Assign the Docker object to the environment variable for persistence
                    env.DOCKER_IMAGE_FRONTEND_OBJ = dockerImageFrontend
                    env.FRONTEND_TAGGED_IMAGE = "${FRONTEND_IMAGE}:${BUILD_NUMBER}" // Store the string tag for k8s deployment
                }
            }
        }

        stage('Build & Tag Backend Image') {
            steps {
                script {
                    echo "🔧 Checking if Backend image ${BACKEND_IMAGE}:latest exists on DockerHub..."
                    sh(script: "docker pull ${BACKEND_IMAGE}:latest", returnStatus: true)
                    def backendExists = env.EXIT_STATUS
                    def dockerImageBackend // Declared for scope

                    if (backendExists != 0) {
                        echo "🛠️ Building new Backend Docker image: ${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        dockerImageBackend = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}", "./${BACKEND_DIR}")
                        dockerImageBackend.tag('latest')
                    } else {
                        echo "✅ Backend image already exists. Skipping build. Will use existing tag: ${BACKEND_IMAGE}:latest"
                        // Mandatory: Create the object from the existing image
                        dockerImageBackend = docker.image("${BACKEND_IMAGE}:latest")
                    }
                    
                    // Assign the Docker object to the environment variable for persistence
                    env.DOCKER_IMAGE_BACKEND_OBJ = dockerImageBackend
                    env.BACKEND_TAGGED_IMAGE = "${BACKEND_IMAGE}:${BUILD_NUMBER}" // Store the string tag for k8s deployment
                }
            }
        }

       stage('Push Images to DockerHub') {
    // Note: The 'when' condition is removed because the variables used here (FRONTEND_IMAGE, BUILD_NUMBER) 
    // are global environment variables and are always available.
    steps {
        script {
            echo "📦 Pushing Docker images to DockerHub..."
            
            // Use withDockerRegistry for login/logout using credentials
            docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDS}") {
                
                // --- PUSH FRONTEND IMAGES ---
                echo "⬆️ Pushing Frontend images (${FRONTEND_IMAGE})..."
                
                // 1. Push the numbered tag (e.g., duskyguy/frontend-image:18)
                sh "docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                
                // 2. Push the 'latest' tag
                sh "docker push ${FRONTEND_IMAGE}:latest"
                

                // --- PUSH BACKEND IMAGES ---
                echo "⬆️ Pushing Backend images (${BACKEND_IMAGE})..."
                
                // 1. Push the numbered tag (e.g., duskyguy/food-backend:18)
                sh "docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}"
                
                // 2. Push the 'latest' tag
                sh "docker push ${BACKEND_IMAGE}:latest"
            }
        }
    }
}
        // -----------------------------------------------------------------
        // GKE DEPLOYMENT STAGE - Modified to use the correct variables
        // -----------------------------------------------------------------
       stage('Deploy to GKE Kubernetes') {
        steps {
            script {
                echo "🚢 Deploying application to Google Kubernetes Engine (GKE)..."
                
                // Securely load GCP Service Account Key file
                withCredentials([file(credentialsId: "${GCP_CRED_ID}", variable: 'GCP_SA_KEY_FILE')]) {
                    
                    // Authenticate and configure kubectl for GKE cluster
                    sh "gcloud auth activate-service-account --key-file=\${GCP_SA_KEY_FILE}"
                    
                    // ====================================================================
                    // 🚀 FIX: Install kubectl and the GKE Auth Plugin (Addressing 'kubectl: not found')
                    // This ensures the necessary tools are available on the Jenkins agent.
                    // ====================================================================
                    sh "gcloud components install kubectl gke-gcloud-auth-plugin --quiet" 
                    
                    // Fetch cluster credentials. This step *uses* the kubectl tool, 
                    // which is now installed above.
                    sh "gcloud container clusters get-credentials ${GKE_CLUSTER} --zone ${GCP_ZONE} --project ${GCP_PROJECT}"
                    
                    // Update the image tags in the manifest files
                    echo "Updating Kubernetes deployment manifests..."
                    
                    // 1. SED for Frontend
                    sh "sed -i 's|DOCKER_IMAGE_FRONTEND_VERSION|${FRONTEND_IMAGE}:${BUILD_NUMBER}|g' frontend/deployment.yaml"

                    // 2. SED for Backend
                    sh "sed -i 's|DOCKER_IMAGE_BACKEND_VERSION|${BACKEND_IMAGE}:${BUILD_NUMBER}|g' backend/deployment.yaml"

                    echo "Applying new deployment to GKE cluster..."
                    
                    // 3. KUBECTL APPLY (This will now succeed)
                    sh "kubectl apply -f frontend/deployment.yaml -f frontend/service.yaml -f backend/deployment.yaml -f backend/service.yaml"
                }
                echo "Deployment completed."
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

}
