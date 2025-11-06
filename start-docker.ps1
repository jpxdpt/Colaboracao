# Script PowerShell para iniciar o projeto com Docker

Write-Host "🚀 Iniciando containers Docker..." -ForegroundColor Cyan
docker-compose up -d --build

Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📋 URLs dos serviços:" -ForegroundColor Green
Write-Host ""
Write-Host "🔵 Backend Local: http://localhost:3000" -ForegroundColor Blue
Write-Host "🟢 Frontend Local: http://localhost" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 URLs Públicas (LocalTunnel):" -ForegroundColor Magenta
Write-Host ""
Write-Host "Para iniciar os tunnels, execute em PowerShell separado:" -ForegroundColor Yellow
Write-Host ".\start-tunnels.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ou manualmente:" -ForegroundColor Yellow
Write-Host "npx localtunnel --port 8081 --subdomain kanbar-dashboard-api" -ForegroundColor Cyan
Write-Host "npx localtunnel --port 80 --subdomain kanbar-dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "Para ver logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Para parar: docker-compose down" -ForegroundColor Cyan

