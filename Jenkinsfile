pipeline {
    tools {
        nodejs 'node'  // Set up your Node.js version, e.g., 'nodejs16' (make sure Node.js is installed in Jenkins)
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
                    branch: 'cart-microservice-nodejs', 
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred' // Add the credentials ID here
                )
            }
        }

        stage('INSTALL DEPENDENCIES') {
            steps {
                echo 'Installing Node.js dependencies...'
                dir('cart-microservice-nodejs') {
                    sh 'npm install'  // Or use `yarn install` if you prefer Yarn
                }
            }
        }


        stage('CODE ANALYSIS WITH SONARQUBE') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    dir('cart-microservice-nodejs') {
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
        }

        stage('BUILD ARTIFACT') {
            steps {
                echo 'Building the Node.js application...'
                dir('cart-microservice-nodejs') {
                    sh 'npm run build'  // Make sure your Node.js project has a build script in package.json
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    dir('cart-microservice-nodejs') {
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
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.result ?: 'UNKNOWN'
                def bannerColor = pipelineStatus.toUpperCase() == 'SUCCESS' ? 'green' : 'red'

                def body = """
                    <html>
                    <body>
                    <div style="border: 4px solid ${bannerColor}; padding: 10px;">
                    <h2>${jobName} - Build ${buildNumber}</h2>
                    <div style="background-color: ${bannerColor}; padding: 10px;">
                    <h3 style="color: white;">Microservices Setup Status: ${pipelineStatus.toUpperCase()}</h3>
                    </div>
                    <p>The setup of the microservices application was ${pipelineStatus.toUpperCase().toLowerCase()}.</p>
                    <p>For more details, check the <a href="${BUILD_URL}">console output</a>.</p>
                    </div>
                    </body>
                    </html>
                """

                emailext (
                    subject: "${jobName} - Microservices Setup Build ${buildNumber} - ${pipelineStatus.toUpperCase()}",
                    body: body,
                    to: 'malakjellali29@gmail.com',
                    from: 'jenkins@example.com',
                    replyTo: 'jenkins@example.com',
                    mimeType: 'text/html'
                )
            }
        }
    }
}
