pipeline {
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }

    environment {
        repository = 'malekjellali1/server'
        eurekaImage = "${repository}:latest"
        setupFile = '/var/jenkins_home/setup_complete.txt'
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

        stage('Checkout Git') {
            steps {
                git(
                    branch: 'eureka-discovery-server', 
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred'
                )
            }
        }

        stage('Maven Clean') {
            steps {
                dir('eureka-discovery-server') {
                    sh 'mvn clean'
                }
            }
        }

        stage('Artifact Construction') {
            steps {
                echo 'Constructing Artifact...'
                dir('eureka-discovery-server') {
                    sh 'mvn package -Dmaven.test.skip=true'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                echo 'Running Unit Tests...'
                dir('eureka-discovery-server') {
                    sh 'mvn test'
                }
            }
        }


        stage('Build Docker Image') {
            steps {
                script {
                    dir('eureka-discovery-server') {
                        dockerImage = docker.build("${eurekaImage}")
                    }
                }
            }
        }

        stage('Push Docker Image') {
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
                    <h3 style="color: white;">Eureka Server Setup Status: ${pipelineStatus.toUpperCase()}</h3>
                    </div>
                    <p>The setup of the Eureka server application was ${pipelineStatus.toUpperCase().toLowerCase()}.</p>
                    <p>For more details, check the <a href="${BUILD_URL}">console output</a>.</p>
                    </div>
                    </body>
                    </html>
                """

                emailext (
                    subject: "${jobName} - Eureka Server Build ${buildNumber} - ${pipelineStatus.toUpperCase()}",
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
