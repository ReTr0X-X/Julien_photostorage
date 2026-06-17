pipeline {
    agent any

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
                sh '''
                    if docker compose version >/dev/null 2>&1; then
                        docker compose down
                    else
                        docker-compose down
                    fi
                '''
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo 'Building production Docker images and launching services...'
                sh '''
                    if docker compose version >/dev/null 2>&1; then
                        docker compose up --build -d
                    else
                        docker-compose up --build -d
                    fi
                '''
            }
        }

        stage('Container Smoke Test') {
            steps {
                echo 'Verifying running containers...'
                sh 'docker ps'
                // Wait for Node server initialization
                sleep time: 10, unit: 'SECONDS'
                // Perform quick health check curl
                sh "curl -I http://localhost:${APP_PORT}/login"
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
            echo "Deployment failed! Inspect logs by running 'docker compose logs' inside workspace."
        }
    }
}
