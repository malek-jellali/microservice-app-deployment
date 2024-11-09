pipeline {
    tools {
        jdk 'jdk17'
        maven 'maven3'
    }
    
    environment {
        repository = 'malekjellali1/server'
        microservice = "${repository}:latest"
    }

    agent any

    stages {
        stage('CHECKOUT GIT') {
            steps {
                git 'https://github.com/malek-jellali/microservice-app-deployment.git'
            }
        }

        stage('MVN CLEAN') {
            steps {
                sh 'mvn clean'
            }
        }

        stage('ARTIFACT CONSTRUCTION') {
            steps {
                echo 'ARTIFACT CONSTRUCTION...'
                sh 'mvn package -Dmaven.test.skip=true -P test-coverage'
            }
        }

        stage('UNIT TESTS') {
            steps {
                echo 'Launching Unit Tests...'
                sh 'mvn test'
            }
        }

        stage('EXECUTE SONARQUBE ANALYSIS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'sonar-cred', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                    sh 'mvn sonar:sonar -Dsonar.projectKey=docker-spring-boot -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=$SONAR_USER -Dsonar.password=$SONAR_PASS'
                }
            }
        }

        stage('PUBLISH TO NEXUS') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-cred', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                    mvn deploy --settings /var/jenkins_home/.m2/settings.xml \\
                        -DaltDeploymentRepository=deploymentRepo::default::http://nexus:8081/repository/maven-releases/ \\
                        -Dusername=${NEXUS_USER} -Dpassword=${NEXUS_PASS}
                    '''
                }
            }
        }

        stage('BUILD DOCKER IMAGE') {
            steps {
                script {
                    // Build Docker image and tag it with the latest version
                    dockerImage = docker.build("${microservice}")
                }
            }
        }

        stage('PUSH DOCKER IMAGE') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', url: 'https://index.docker.io/v1/') {
                        // Push both latest and BUILD_NUMBER tags if required
                        dockerImage.push("latest")
                        dockerImage.push("${env.BUILD_NUMBER}")
                    }
                }
            }
        }
    } // End of stages block
} // End of pipeline block
