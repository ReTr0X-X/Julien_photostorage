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
                checkout scm
            }
        }

        stage('Dependency Check & Lint') {
            steps {
                echo 'Installing dev dependencies and running linter check...'
                sh 'npm install'
                sh 'npm run lint'
            }
        }

        stage('Prune Containers') {
            steps {
                echo 'Stopping existing deployments...'
                sh 'docker compose down'
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo 'Building production Docker images and launching services...'
                sh 'docker compose up --build -d'
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
