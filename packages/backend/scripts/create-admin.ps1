# Script PowerShell para criar admin (Windows)
Set-Location $PSScriptRoot\..
npm run build --workspace=@gamify/shared
if ($LASTEXITCODE -eq 0) {
    Set-Location backend
    tsx src/scripts/createAdmin.ts
}

