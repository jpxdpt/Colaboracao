# Script PowerShell para iniciar LocalTunnel depois dos containers estarem a correr
# Este script deve ser executado no host (não dentro do Docker)

Write-Host "🌐 Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📡 A iniciar LocalTunnel para backend..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    npx localtunnel --port 8081 --subdomain kanbar-dashboard-api
}

Write-Host "📡 A iniciar LocalTunnel para frontend..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    npx localtunnel --port 80 --subdomain kanbar-dashboard
}

Write-Host "✅ Tunnels iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Magenta
Write-Host "Backend: https://kanbar-dashboard-api.loca.lt" -ForegroundColor Blue
Write-Host "Frontend: https://kanbar-dashboard.loca.lt" -ForegroundColor Green
Write-Host ""
Write-Host "Para parar os tunnels, execute:" -ForegroundColor Yellow
Write-Host "Stop-Job $backendJob, $frontendJob" -ForegroundColor Cyan

# Manter o script a correr
try {
    Wait-Job $backendJob, $frontendJob
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
}

