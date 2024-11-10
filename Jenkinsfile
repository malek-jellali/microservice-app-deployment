pipeline {
    agent any
    
     environment {
        AWS_REGION = 'us-east-1' 
        CLUSTER_NAME = 'microservices-cluster'
    }

    parameters {
        booleanParam(name: 'RUN_SETUP', defaultValue: false, description: 'Run setup tasks (set to true for manual execution)')
    }

    stages {
        stage('CHECKOUT GIT') {
            when {
                expression { return params.RUN_SETUP }
            }
            steps {
    git branch: 'setup', url: 'https://github.com/malek-jellali/microservice-app-deployment.git'
}
        }

        stage('Test AWS Credentials') {
            when {
                expression { return params.RUN_SETUP }
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
                expression { return params.RUN_SETUP }
            }
            steps {
                dir('Terraform') {
                    script {
                        sh 'terraform init'
                        sh 'terraform plan'
                        sh 'terraform apply -auto-approve'
                    }
                }
            }
        }


 stage('set cluster context') {
            steps {
                withEnv(["KUBECONFIG=/var/jenkins_home/.kube/config"]) {
                    sh "aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${AWS_REGION}"
                }
            }
        }
        
        stage('Setup Monitoring with Prometheus and Grafana') {
            when {
                expression { return params.RUN_SETUP }
            }
            steps {
                 script {
                    echo "STAGE DONE"
                    sh '''
                    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                    helm repo update
                    helm install mon prometheus-community/kube-prometheus-stack
                    kubectl expose service mon-kube-prometheus-stack-prometheus --type=NodePort --target-port=9090 --name=prometheus-ext
                    kubectl expose service mon-grafana --type=NodePort --target-port=3000 --name=grafana-ext
                    '''
                    sh '''
                    echo "Grafana Admin Password:"
                    kubectl get secret --namespace default mon-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
                    ''' 
                }
            }
        }
        
       
        
        
        stage('Install Argo CD and Argo CD Image Updater') {
        when {
                expression { return params.RUN_SETUP }
            }
            steps {
                script {
                    sh 'kubectl create namespace argocd || true'
                    sh 'kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml'
                    sh 'kubectl patch svc argocd-server -n argocd -p \'{"spec": {"type": "NodePort"}}\''
                    sh 'kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml'
                    sh '''
                    echo "Argo CD Initial Admin Password:"
                    kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
                    '''
                }
            }
        }
        
    }

    post {
    success {
        // Create a file or flag to indicate setup completion
        writeFile(file: 'setup_complete.txt', text: 'Setup Complete')
        archiveArtifacts artifacts: 'setup_complete.txt', allowEmptyArchive: true
    }
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
