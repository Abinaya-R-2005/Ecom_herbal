# Restructure Script - Fast Execution
$ErrorActionPreference = "Stop"

Write-Host "Starting restructure..." -ForegroundColor Green

# 1. Copy frontend build to public_html
Write-Host "Copying frontend build to public_html..." -ForegroundColor Yellow
Copy-Item -Path "frontend\build\*" -Destination "public_html\" -Recurse -Force

# 2. Move backend files to organized structure
Write-Host "Organizing backend files..." -ForegroundColor Yellow

# Move mailer.js to middleware (it's a utility/middleware)
Move-Item -Path "backend\mailer.js" -Destination "backend\middleware\mailer.js" -Force

# Create empty placeholder files for routes, controllers, models
# (Since all logic is in server.js, we'll document this)
@"
// Routes will be extracted from server.js
// This is a placeholder for future route organization
"@ | Out-File -FilePath "backend\routes\index.js" -Encoding UTF8

@"
// Controllers will be extracted from server.js
// This is a placeholder for future controller organization
"@ | Out-File -FilePath "backend\controllers\index.js" -Encoding UTF8

@"
// Models will be extracted from server.js
// This is a placeholder for future model organization
"@ | Out-File -FilePath "backend\models\index.js" -Encoding UTF8

Write-Host "Restructure complete!" -ForegroundColor Green
Write-Host ""
Write-Host "New Structure:" -ForegroundColor Cyan
Write-Host "  public_html/ - Frontend (built React app)" -ForegroundColor White
Write-Host "  backend/ - Backend with organized folders" -ForegroundColor White
