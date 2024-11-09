pipeline {
    tools {
        python 'Python 3.11.2'  // Make sure Python is installed in Jenkins with the correct version.
    }
    
    environment {
        repository = 'malekjellali1/wishlist'
        microservice = "${repository}:latest"  // Docker image name with the 'latest' tag
    }

    agent any

    stages {
        stage('CHECKOUT GIT') {
            steps {
                git 'https://github.com/malek-jellali/microservice-app-deployment.git'
            }
        }

        stage('SETUP VIRTUAL ENVIRONMENT') {
            steps {
                sh 'python3 -m venv venv'
                sh '. venv/bin/activate'
            }
        }

        stage('INSTALL DEPENDENCIES') {
            steps {
                echo 'Installing Python dependencies...'
                sh '. venv/bin/activate && pip install -r requirements.txt'
            }
        }

        stage('LINT CODE') {
            steps {
                echo 'Running flake8 to check code quality...'
                sh '. venv/bin/activate && flake8 .'  // Assuming flake8 is listed in requirements.txt
            }
        }

        stage('RUN UNIT TESTS') {
            steps {
                echo 'Running unit tests with coverage...'
                sh '. venv/bin/activate && pytest --cov=. tests/'  // Assuming pytest and pytest-cov are in requirements.txt
            }
        }

        stage('EXECUTE SONARQUBE ANALYSIS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    sh 'sonar-scanner -Dsonar.projectKey=python-app -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER'
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    dockerImage = docker.build("${microservice}")
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
