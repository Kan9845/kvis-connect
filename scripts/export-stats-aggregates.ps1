$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "export-stats-aggregates.sql"
$outputPath = Join-Path $env:USERPROFILE "Downloads\kvis-export\stats-aggregates.json"
$connectionUrl = Read-Host "Paste the private Neon PostgreSQL URL"

if ([string]::IsNullOrWhiteSpace($connectionUrl)) {
  throw "A PostgreSQL connection URL is required."
}
try {
  $connection = [Uri]$connectionUrl
} catch {
  throw "The value is not a valid PostgreSQL connection URL."
}
if ([string]::IsNullOrWhiteSpace($connection.Host) -or $connection.Host -notmatch "\.") {
  throw "This is an internal-only database URL. From your computer, copy the External Database URL from the database provider instead."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is not available in this PowerShell window. Start Docker Desktop and try again."
}

$sql = Get-Content $scriptPath -Raw
$result = $sql | docker run --rm -i postgres:18 psql $connectionUrl -X -v ON_ERROR_STOP=1 -t -A
if ($LASTEXITCODE -ne 0) {
  throw "The read-only stats query failed. No output file was written."
}
$json = ($result -join "`n").Trim()
if ([string]::IsNullOrWhiteSpace($json)) {
  throw "The query returned no output. No output file was written."
}

$json | Set-Content $outputPath -NoNewline
Write-Host "Created aggregate-only stats export: $outputPath"
