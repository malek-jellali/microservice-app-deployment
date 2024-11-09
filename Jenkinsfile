pipeline {
    agent any

    parameters {
        booleanParam(name: 'RUN_SETUP', defaultValue: false, description: 'Run setup tasks (set to true for manual execution)')
    }

    stages {
        stage('CHECKOUT GIT') {
            when {
                expression {
                    return params.RUN_SETUP
                }
            }
            steps {
                git 'https://github.com/Fares-Rbd/IGL5-G4-timesheet.git'
            }
        }

        stage('Test AWS Credentials') {
            when {
                expression {
                    return params.RUN_SETUP
                }
            }
            steps {
                withCredentials([file(credentialsId: 'aws-cred', variable: 'AWS_CREDENTIALS_FILE')]) {
                    script {
                        def awsCredentials = readFile(AWS_CREDENTIALS_FILE).trim().split("\n")
                        env.AWS_ACCESS_KEY_ID = awsCredentials.find { it.startsWith("aws_access_key_id") }.split("=")[1].trim()
                        env.AWS_SECRET_ACCESS_KEY = awsCredentials.find { it.startsWith("aws_secret_access_key") }.split("=")[1].trim()
                        env.AWS_SESSION_TOKEN = awsCredentials.find { it.startsWith("aws_session_token") }?.split("=")[1]?.trim()

                        echo "AWS Access Key ID: ${env.AWS_ACCESS_KEY_ID}"
                        echo "AWS Session Token: ${env.AWS_SESSION_TOKEN}"
                        echo "AWS Credentials File Loaded Successfully"
                    }
                }
            }
        }

        stage('Terraform Init and Apply') {
            when {
                expression {
                    return params.RUN_SETUP
                }
            }
            steps {
                dir('terraform') {
                    script {
                        sh 'terraform init'
                        sh 'terraform plan'
                        sh 'terraform apply -auto-approve'
                    }
                }
            }
        }

        stage('Setup Monitoring with Prometheus and Grafana') {
            when {
                expression {
                    return params.RUN_SETUP
                }
            }
            steps {
                script {
                    sh 'kubectl create namespace monitoring || true'

                    // Prometheus setup
                    sh '''
                    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                    helm repo update
                    helm install prometheus prometheus-community/prometheus --namespace monitoring
                    kubectl expose service prometheus-server --type=NodePort --target-port=9090 --name=prometheus-server-ext --namespace monitoring
                    '''

                    // Grafana setup
                    sh '''
                    helm repo add grafana https://grafana.github.io/helm-charts
                    helm repo update
                    helm install grafana grafana/grafana --namespace monitoring
                    kubectl expose service grafana --type=NodePort --target-port=3000 --name=grafana-ext --namespace monitoring
                    '''

                    sh '''
                    echo "Grafana Admin Password:"
                    kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
                    '''
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
