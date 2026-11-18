pipeline {
  agent any 
  tools { 
    nodejs 'node-20' 
  } 
  environment {
    // Reemplaza con el nombre de tu organización real en Snyk si es necesario
    SNYK_ORG = 'grupo-cero-uno-zero-tecnologias-s.a-default' 
  }
  stages {
    stage('Checkout') {
      steps { 
        checkout scm 
      }
    }
    
    stage('Dependencias') {
      steps {
        dir('frontend') { 
          bat 'npm ci --no-audit --no-fund' // Usa 'sh' si tu agente es Linux/Mac en lugar de Windows
        }
      }
    }
    
    stage('Pruebas funcionales — QA') {
      steps {
        dir('frontend') {
          bat 'npm test -- --reporter=verbose --reporter=junit --outputFile=test-results.xml'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'frontend/test-results.xml'
        }
      }
    }
    
    stage('Snyk Security Gate') {
      steps {
        withCredentials([string(credentialsId: 'snyk-service-token', variable: 'SNYK_TOKEN')]) {
          bat 'npm i -g snyk'
          script {
            // 1. Snyk Open Source (SCA)
            def oss = bat returnStatus: true,
                script: 'snyk test --all-projects --json --severity-threshold=high --org=%SNYK_ORG% > snyk-oss.json'
            if (oss != 0) { unstable('Snyk OSS: hallazgos high/critical encontrados') }
            
            // 2. Snyk Code (SAST - XSS, Secretos)
            def code = bat returnStatus: true,
                script: 'snyk code test --json --severity-threshold=high --org=%SNYK_ORG% > snyk-code.sarif'
            if (code != 0) { unstable('Snyk Code: Se detectaron vulnerabilidades de código o secretos') }
            
            // 3. Snyk IaC (Infraestructura como código)
            def iac = bat returnStatus: true,
                script: 'snyk iac test iac/main.tf --json --severity-threshold=high --org=%SNYK_ORG% > snyk-iac.json'
            if (iac != 0) { unstable('Snyk IaC: Configuraciones de infraestructura inseguras') }
          }
        }
      }
    }
  }  
  post {
    always {
      archiveArtifacts allowEmptyArchive: true, artifacts: 'snyk-*.json, snyk-*.sarif, frontend/test-results.xml'
    }
  }
}