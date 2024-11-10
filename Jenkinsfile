pipeline {
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }

    environment {
        repository = 'malekjellali1/api-gateway'
        gatewayImage = "${repository}:latest"
        setupFile = '/var/jenkins_home/setup_complete.txt'  // Path to the setup flag file inside the Jenkins container
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
                    branch: 'zuul-api-gateway',  // Change to the actual branch for the API Gateway
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred'
                )
            }
        }

        stage('MVN CLEAN') {
            steps {
                dir('zuul-api-gateway') {  // Change to the directory containing the API Gateway files
                    sh 'mvn clean'
                }
            }
        }

        stage('BUILD ARTIFACT') {
            steps {
                echo 'Building Artifact...'
                dir('zuul-api-gateway') {
                    sh 'mvn package -Dmaven.test.skip=true -P test-coverage'
                }
            }
        }

        stage('RUN UNIT TESTS') {
            steps {
                echo 'Running Unit Tests...'
                dir('zuul-api-gateway') {
                    sh 'mvn test'
                }
            }
        }

        stage('SONARQUBE ANALYSIS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    dir('zuul-api-gateway') {
                        sh 'mvn sonar:sonar -Dsonar.projectKey=api-gateway -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER -Dsonar.password=$SONAR_PASS'
                    }
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    dir('zuul-api-gateway') {
                        dockerImage = docker.build("${gatewayImage}")
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
                    <h3 style="color: white;">API Gateway Build Status: ${pipelineStatus.toUpperCase()}</h3>
                    </div>
                    <p>The build and setup for the API Gateway was ${pipelineStatus.toUpperCase().toLowerCase()}.</p>
                    <p>For more details, check the <a href="${BUILD_URL}">console output</a>.</p>
                    </div>
                    </body>
                    </html>
                """

                emailext (
                    subject: "${jobName} - API Gateway Build ${buildNumber} - ${pipelineStatus.toUpperCase()}",
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
