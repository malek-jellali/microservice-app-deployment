pipeline {
    tools {
        nodejs 'node'  // Ensure that your Node.js and npm are set up and available in Jenkins
    }
    
    environment {
        repository = 'malekjellali1/react-ui'
        microservice = "${repository}:latest"  // Docker image name with the 'latest' tag
    }

    agent any

    stages {
        stage('CHECKOUT GIT') {
            steps {
                git 'https://github.com/your-github-username/your-react-repo.git'
            }
        }

        stage('INSTALL DEPENDENCIES') {
            steps {
                sh 'npm install'
            }
        }

        stage('LINT CODE') {
            steps {
                echo 'Running ESLint to check code quality...'
                sh 'npm run lint'
            }
        }

        stage('RUN UNIT TESTS') {
            steps {
                echo 'Running unit tests...'
                sh 'npm test -- --coverage'  // Run tests with coverage
            }
        }

        stage('BUILD REACT APP') {
            steps {
                echo 'Building React app for production...'
                sh 'npm run build'  // Production build
            }
        }

        stage('EXECUTE SONARQUBE ANALYSIS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    sh 'npx sonar-scanner -Dsonar.projectKey=react-app -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER'
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    // Build Docker image using the defined reactAppImage environment variable
                    dockerImage = docker.build("${microservice}")
                }
            }
        }

        stage('PUSH DOCKER IMAGE') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                        // Push the Docker image with both the 'latest' and the build number tag
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
            deleteDir()  // Clean up the workspace after the build
        }
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Please check the logs for details.'
        }
    }
}
