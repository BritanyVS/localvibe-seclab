pipeline {
  agent any

  tools {
    // El nombre del tool instalado en Jenkins (aunque descargue Node v26.13.1)
    nodejs 'node-20'
  }

  environment {
    SNYK_ORG = 'grupo-cero-uno-zero-tecnologias-s.a-default'
    // Región US (la misma que usa la extensión). Si tu org está en la región
    // global/EU, cámbialo por https://api.snyk.io o elimina esta variable.
    SNYK_API = 'https://api.us.snyk.io'
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
          bat 'npm ci --no-audit --no-fund'
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

    // Autenticación explícita: el error "Use `snyk auth` to authenticate."
    // significa que la CLI no encontró el token. Lo fijamos con snyk auth y
    // validamos con whoami ANTES de escanear, para que un 401 no se disfrace
    // de "vulnerabilidades encontradas".
    stage('Snyk: autenticación') {
      steps {
        withCredentials([string(credentialsId: 'snyk-service-token',
                                variable: 'SNYK_TOKEN')]) {
          withEnv(["SNYK_TOKEN=${env.SNYK_TOKEN}", "SNYK_API=${env.SNYK_API}"]) {
            bat 'npm i -g --allow-scripts=snyk snyk@1.1308.4'
            bat 'snyk auth %SNYK_TOKEN%'
            bat 'snyk whoami'
          }
        }
      }
    }

    stage('Snyk Security Gate') {
      steps {
        withCredentials([string(credentialsId: 'snyk-service-token',
                                variable: 'SNYK_TOKEN')]) {
          withEnv(["SNYK_TOKEN=${env.SNYK_TOKEN}", "SNYK_API=${env.SNYK_API}"]) {
            script {
              def escanear = { String cmd, String salida ->
                def rc = bat returnStatus: true,
                           script: "${cmd} 1>${salida} 2>${salida}.err"
                if (fileExists(salida)) {
                  def txt = readFile(salida)
                  if (txt.contains('Use `snyk auth`') ||
                      txt.contains('SNYK-0005') ||
                      txt.contains('Authentication error') ||
                      txt.contains('401 Unauthorized')) {
                    error("FALLO DE AUTENTICACIÓN Snyk en ${salida}: revisa el Secret Text 'snyk-service-token' y SNYK_API")
                  }
                }
                if (rc != 0) {
                  unstable("Hallazgos Snyk en ${salida}")
                }
              }

              // 1. Open Source (SCA)
              escanear('snyk test --all-projects --json --severity-threshold=high --org=%SNYK_ORG%', 'snyk-oss.json')

              // 2. Code (SAST - DOM XSS + secreto hardcoded)
              escanear('snyk code test --json --severity-threshold=high --org=%SNYK_ORG%', 'snyk-code.sarif')

              // 3. IaC: los hallazgos son medium/low, por eso el threshold es medium
              escanear('snyk iac test iac/main.tf --json --severity-threshold=medium --org=%SNYK_ORG%', 'snyk-iac.json')
            }
          }
        }
      }
    }
  }

  post {
    always {
      script {
        // Reporte legible para QA: convierte los artefactos crudos en HTML + Markdown.
        // Se genera en post/always para que exista incluso si el gate cambia a error().
        if (fileExists('scripts/generate-qa-report.mjs')) {
          def rc = bat returnStatus: true,
                     script: 'node scripts/generate-qa-report.mjs --input . --output reports/qa-report --status "%BUILD_STATUS%"'
          if (rc != 0) {
            echo 'AVISO: no se pudo generar el reporte QA; se archivan solo los artefactos crudos.'
          }
        }
      }
      archiveArtifacts allowEmptyArchive: true,
                       artifacts: 'reports/qa-report.html, reports/qa-report.md, snyk-*.json, snyk-*.sarif, snyk-*.err, frontend/test-results.xml'
    }
  }
}
