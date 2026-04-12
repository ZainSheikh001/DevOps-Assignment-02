pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'zainsheikh010'
        IMAGE_NAME = 'jobportal-app'
    }

    stages {
        stage('Clone') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/ZainSheikh001/DevOps-Assignment-02.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${DOCKERHUB_USER}/${IMAGE_NAME}:latest .'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USERNAME',
                    passwordVariable: 'PASSWORD'
                )]) {
                    sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                    sh 'docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:latest'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose -f docker-compose-jenkins.yml down --remove-orphans || true'
                sh 'docker-compose -f docker-compose-jenkins.yml up -d'
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}
