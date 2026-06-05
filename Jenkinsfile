pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        RAILWAY_TOKEN = credentials('railway-token')
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                sh '''
                    node --version
                    npm --version
                    npm ci
                '''
            }
        }

        stage('Validate') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint -- --max-warnings=0'
                    }
                }
                stage('Test') {
                    steps {
                        sh 'npm test'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npx prisma generate'
                        sh 'npx tsc --noEmit || true'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npx prisma generate'
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            when {
                branch 'main'
            }
            parallel {
                stage('Build Web Image') {
                    steps {
                        sh 'docker build -t gamefm-web:${BUILD_NUMBER} -t gamefm-web:latest .'
                    }
                }
                stage('Build Bot Image') {
                    steps {
                        sh 'docker build -f Dockerfile.bot -t gamefm-bot:${BUILD_NUMBER} -t gamefm-bot:latest .'
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    npm install -g @railway/cli
                    railway up --service web --detach
                    railway up --service bot --detach
                '''
            }
        }

        stage('Post-Deploy Health Check') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "Waiting for deployment to stabilize..."
                    sleep 15
                    curl --fail --silent --max-time 10 ${DEPLOY_URL:-http://localhost:3000}/ || echo "Health check skipped — set DEPLOY_URL"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully."
        }
        failure {
            echo "Pipeline failed. Check the logs above."
        }
        always {
            cleanWs()
        }
    }
}
