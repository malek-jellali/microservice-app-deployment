pipeline {
    tools {
        nodejs 'node'  // Ensure that your Node.js and npm are set up and available in Jenkins
    }
    
    environment {
        repository = 'malekjellali1/cart'
        microservice = "${repository}:latest"  // Set up the image name with tag 'latest'
        setupFile = '/var/jenkins_home/setup_complete.txt'  // Path to the setup flag file inside the Jenkins container
    }

    agent any

    stages {
        stage('Wait for Setup Completion') {
            steps {
                script {
                    retry(10) { // Retry up to 10 times, adjust as needed
                        // Check if the setup_complete.txt file exists inside the Jenkins container
                        if (!fileExists("${env.setupFile}")) {
                            echo "Setup not complete. Waiting..."
                            sleep(30) // Wait 30 seconds before retrying
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
                    branch: 'ui-web-app-reactjs', 
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred' 
                )
            }
        }

        stage('INSTALL DEPENDENCIES') {
            steps {
                echo 'Installing dependencies...'
                script {
                    dir('ui-app') {
                        sh 'npm install '  // Skip optional dependencies like Sass
                    }
                }
            }
        }

        stage('LINT CODE') {
            steps {
                echo 'Running ESLint to check code quality...'
                script {
                    dir('ui-app') {
                        sh 'npm run lint'
                    }
                }
            }
        }

        stage('RUN UNIT TESTS') {
            steps {
                echo 'Running unit tests...'
                script {
                    dir('ui-app') {
                        sh 'npm test -- --coverage'  
                    }
                }
            }
        }

        stage('BUILD REACT APP') {
            steps {
                echo 'Building React app for production...'
                script {
                    dir('ui-app') {
                        sh 'CI=false npm run build'  
                    }
                }
            }
        }

       stage('SONARQUBE ANALYSIS') {
    steps {
        withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
            dir('ui-app') {  
                sh 'npx sonar-scanner -Dsonar.projectKey=api-gateway -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER -Dsonar.password=$SONAR_PASS'
            }
        }
    }
}


        stage('BUILD DOCKER IMAGE') {
            steps {
                echo 'Building Docker image...'
                script {
                    dir('ui-app') {
                        dockerImage = docker.build("${microservice}", '.')  
                    }
                }
            }
        }

        stage('PUSH DOCKER IMAGE') {
            steps {
                echo 'Pushing Docker image...'
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
