pipeline {
    tools {
        nodejs 'node'  // Set up your Node.js version, e.g., 'nodejs16' (make sure Node.js is installed in Jenkins)
    }
    
    environment {
        repository = 'malekjellali1/cart'
        microservice = "${repository}:latest"  // Set up the image name with tag 'latest'
    }

    agent any

    stages {
        stage('CHECKOUT GIT') {
            steps {
                git 'https://github.com/malek-jellali/microservice-app-deployment.git'
            }
        }

        stage('INSTALL DEPENDENCIES') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'npm install'  // Or use `yarn install` if you prefer Yarn
            }
        }

        stage('RUN UNIT TESTS') {
            steps {
                echo 'Running Unit Tests...'
                sh 'npm test'  // Make sure your Node.js project has a test script in package.json
            }
        }

        stage('CODE ANALYSIS WITH SONARQUBE') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    sh '''
                    npm run sonar -- \
                        -Dsonar.projectKey=nodejs-microservice \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.login=$SONAR_USER \
                        -Dsonar.password=$SONAR_PASS
                    '''
                }
            }
        }

        stage('BUILD ARTIFACT') {
            steps {
                echo 'Building the Node.js application...'
                sh 'npm run build'  // Make sure your Node.js project has a build script in package.json
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
}
