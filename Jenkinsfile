pipeline {
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }
    
    environment {
        repository = 'malekjellali1/server'
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
                    branch: 'eureka-discovery-server',
                    url: 'https://github.com/malek-jellali/microservice-app-deployment.git',
                    credentialsId: 'github-cred'
                )
            }
        }

        stage('MVN CLEAN') {
            steps {
                dir('eureka-discovery-server') {
                    sh 'mvn clean'
                }
            }
        }

        stage('ARTIFACT CONSTRUCTION') {
            steps {
                dir('eureka-discovery-server') {
                    echo 'Building Artifact...'
                    sh 'mvn package -P test-coverage'
                }
            }
        }

        stage('UNIT TESTS') {
            steps {
                dir('eureka-discovery-server') {
                    echo 'Launching Unit Tests...'
                    sh 'mvn test'
                }
            }
        }

        stage('EXECUTE SONARQUBE ANALYSIS') {
            steps {
                dir('eureka-discovery-server') {
                    withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                        sh 'mvn sonar:sonar -Dsonar.projectKey=docker-spring-boot -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER'
                    }
                }
            }
        }

        stage('PUBLISH TO NEXUS') {
            steps {
                dir('eureka-discovery-server') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh '''
                        mvn deploy --settings /var/jenkins_home/.m2/settings.xml \\
                            -DaltDeploymentRepository=deploymentRepo::default::http://nexus:8081/repository/maven-releases/ \\
                            -Dusername=${NEXUS_USER} -Dpassword=${NEXUS_PASS}
                        '''
                    }
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    dir('eureka-discovery-server') {
                        dockerImage = docker.build("${env.microservice}")
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
}
