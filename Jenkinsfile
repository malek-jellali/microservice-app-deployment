pipeline {
    environment {
        repository = 'malekjellali1/cart'
        setupFile = '/var/jenkins_home/setup_complete.txt'
        microservice = "${repository}:latest" 
    }

    agent any

    stages {
        stage('Wait for Setup Completion') {
            steps {
                script {
                    retry(10) {
                        if (!fileExists("${env.setupFile}")) {
                            echo "Setup not complete. Waiting..."
                            sleep(30)
                            error("Setup not completed yet.")
                        } else {
                            echo "Setup complete. Proceeding with build."
                        }
                    }
                }
            }
        }

        stage('CHECKOUT GIT') {
            steps {
                git(
                    branch: 'wishlist-microservice-python',
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred'
                )
            }
        }
       

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    dir('wishlist-microservice-python') {
                        dockerImage = docker.build("${microservice}")
                    }
                }
            }
        }

        stage('PUSH DOCKER IMAGE') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                        dockerImage.push("latest")
                        dockerImage.push("${env.BUILD_NUMBER}")
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            deleteDir()
        }
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Please check the logs for details.'
        }
    }
}
