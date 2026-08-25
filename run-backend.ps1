# =========================================================================
# ACCESSIBLE CONNECT - BACKEND LAUNCHER WITH ENV LOADER
# =========================================================================

$envFile = Join-Path (Get-Location) ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -like '*=*' } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        $cleanName = $name.Trim()
        $cleanValue = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($cleanName, $cleanValue, [System.EnvironmentVariableTarget]::Process)
    }
    Write-Host "Success: Loaded environment variables from .env" -ForegroundColor Green
} else {
    Write-Host "Warning: .env file not found. Using system-defined environment variables." -ForegroundColor Yellow
}

# Change directory and boot Spring Boot application via Maven Wrapper
Write-Host "Booting Accessible Connect Backend..." -ForegroundColor Cyan
cd backend
.\mvnw.cmd spring-boot:run
