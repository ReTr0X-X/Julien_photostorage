pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_PORT = '8899'
    }

    stages {
        stage('Initialize') {
            steps {
                echo 'Starting EMS Vault deployment pipeline...'
            }
        }

        stage('Checkout SCM') {
            steps {
                script {
                    try {
                        checkout scm
                    } catch (Exception e) {
                        echo "SCM checkout is niet beschikbaar (inline pipeline script). Handmatige Git checkout starten..."
                        git branch: 'main', url: 'https://github.com/ReTr0X-X/Julien_photostorage.git'
                    }
                }
            }
        }

        stage('Prune Containers') {
            steps {
                echo 'Stopping existing deployments...'
                sh 'docker stop ems_vault_web || true'
                sh 'docker rm ems_vault_web || true'
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo 'Building production Docker images and launching services...'
                sh 'docker build -t ems_vault_web:latest .'
                sh 'docker run -d --name ems_vault_web --restart always -p ${APP_PORT}:3000 --add-host host.docker.internal:host-gateway -v upload_data:/app/public/uploads -e DB_HOST="${DB_HOST:-host.docker.internal}" -e DB_PORT="${DB_PORT:-3306}" -e DB_USER="${DB_USER:-root}" -e DB_PASSWORD="${DB_PASSWORD:-rootpassword}" -e DB_NAME="${DB_NAME:-ems_vault}" -e ADMIN_USER="${ADMIN_USER:-officer}" -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-evidence2026}" ems_vault_web:latest'
            }
        }

        stage('Container Smoke Test') {
            steps {
                echo 'Verifying running containers...'
                sh 'docker ps'
                // Wait for Node server initialization
                sleep time: 10, unit: 'SECONDS'
                // Get the container IP and perform quick health check curl
                sh '''
                    CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ems_vault_web)
                    echo "Checking health for ems_vault_web container at IP: ${CONTAINER_IP}"
                    curl -I http://${CONTAINER_IP}:3000/login
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline complete! EMS Vault is online at http://localhost:${APP_PORT}"
        }
        failure {
            echo "Deployment failed! Inspect logs by running 'docker logs ems_vault_web' inside workspace."
        }
    }
}
