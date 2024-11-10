pipeline {
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }

    environment {
        repository = 'malekjellali1/offer'
        microservice = "${repository}:latest"
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
                    branch: 'offers-microservice-spring-boot', 
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred' // Add the credentials ID here
                )
            }
        }

        stage('MVN CLEAN') {
            steps {
                // Change directory to the correct folder where pom.xml is located
                dir('offers-microservice-spring-boot') {
                    sh 'mvn clean'
                }
            }
        }

        stage('ARTIFACT CONSTRUCTION') {
            steps {
                echo 'Constructing Artifact...'
                // Change directory to the correct folder where pom.xml is located
                dir('offers-microservice-spring-boot') {
                    sh 'mvn package -Dmaven.test.skip=true -P test-coverage'
                }
            }
        }

        stage('UNIT TESTS') {
            steps {
                echo 'Running Unit Tests...'
                // Change directory to the correct folder where pom.xml is located
                dir('offers-microservice-spring-boot') {
                    sh 'mvn test'
                }
            }
        }

        stage('EXECUTE SONARQUBE ANALYSIS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    dir('offers-microservice-spring-boot') {
                        sh 'mvn sonar:sonar -Dsonar.projectKey=docker-spring-boot -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER -Dsonar.password=$SONAR_PASS'
                    }
                }
            }
        }

      stage('PUBLISH TO NEXUS') {
    steps {
        script {
            // Base version for the release (this could be a static version or a versioning scheme like 1.0)
            def baseVersion = "1.0"
            // Use the Jenkins build number to create a unique version
            def releaseVersion = "${baseVersion}.${env.BUILD_NUMBER}"

            // Automatically set the version using the Jenkins build number
            echo "Using version: ${releaseVersion}"

            // Use the 'dir' step to change to the directory where the pom.xml is located
            dir('offers-microservice-spring-boot') {  // Change to the folder containing the pom.xml
                // Set the Maven version to this release version
                sh "mvn versions:set -DnewVersion=${releaseVersion}"

                // Deploy the artifact to Nexus
                withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    // Nexus release repository URL
                    def repositoryUrl = 'http://nexus:8081/repository/maven-releases/'

                    // Deploy using Maven
                    sh """
                        mvn deploy --settings /var/jenkins_home/.m2/settings.xml \
                        -DaltDeploymentRepository=deploymentRepo::default::${repositoryUrl} \
                        -Dusername="${NEXUS_USER}" \
                        -Dpassword="${NEXUS_PASS}"
                    """
                }
            }
        }
    }
}



     stage('BUILD DOCKER IMAGE') {
    steps {
        script {
            dir('offers-microservice-spring-boot') {
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
