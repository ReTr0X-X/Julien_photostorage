pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_PORT = '8899'
        DOCKER_NETWORK = 'proxynet'
        DB_HOST = 'mariadb'
        DB_USER = 'root'
        DB_PASSWORD = '33wh40k777666'
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
                sh 'docker run -d --name ems_vault_web --restart always -p ${APP_PORT}:3000 --network ${DOCKER_NETWORK} -v upload_data:/app/public/uploads -e DB_HOST="${DB_HOST}" -e DB_PORT="${DB_PORT:-3306}" -e DB_USER="${DB_USER:-root}" -e DB_PASSWORD="${DB_PASSWORD:-rootpassword}" -e DB_NAME="${DB_NAME:-ems_vault}" -e ADMIN_USER="${ADMIN_USER:-officer}" -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-evidence2026}" ems_vault_web:latest'
            }
        }

        stage('Container Smoke Test') {
            steps {
                echo 'Verifying running containers...'
                sh 'docker ps'
                // Wait for Node server initialization
                sleep time: 10, unit: 'SECONDS'
                // Perform health check inside the container using Node's native fetch
                sh 'docker exec ems_vault_web node -e "fetch(\'http://localhost:3000/login\').then(r => { console.log(\'Status:\', r.status); if (r.status !== 200) process.exit(1); }).catch(err => { console.error(err); process.exit(1); })"'
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
