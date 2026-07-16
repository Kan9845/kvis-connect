$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "export-stats-aggregates.sql"
$outputDirectory = Join-Path $env:USERPROFILE "Downloads\kvis-export"
$outputPath = Join-Path $outputDirectory "stats-aggregates.json"
$temporaryPath = $null
$connectionUrl = $null
$databasePassword = $null
$previousPassword = $env:PGPASSWORD
$previousSslMode = $env:PGSSLMODE
$previousOptions = $env:PGOPTIONS

function Read-SecureText([string]$Prompt) {
  $secureValue = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

try {
  if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
    throw "The aggregate SQL file is missing. Restore scripts/export-stats-aggregates.sql and try again."
  }
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not available in this PowerShell window. Start Docker Desktop and try again."
  }
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running or is not available to this user."
  }

  $targetEnvironment = (Read-Host "Target database (STAGING or PRODUCTION)").Trim().ToUpperInvariant()
  if ($targetEnvironment -notin @("STAGING", "PRODUCTION")) {
    throw "Enter exactly STAGING or PRODUCTION. No database connection was attempted."
  }
  if ($targetEnvironment -eq "PRODUCTION") {
    $confirmation = Read-Host "Type EXPORT PRODUCTION AGGREGATES to continue"
    if ($confirmation -cne "EXPORT PRODUCTION AGGREGATES") {
      throw "Production export cancelled. No database connection was attempted."
    }
  }

  $connectionUrl = Read-SecureText "Paste the External PostgreSQL URL (input is hidden)"
  if ([string]::IsNullOrWhiteSpace($connectionUrl)) {
    throw "A PostgreSQL connection URL is required."
  }
  try {
    $connection = [Uri]$connectionUrl
  } catch {
    throw "The supplied value is not a valid PostgreSQL connection URL."
  }
  if ($connection.Scheme -notin @("postgres", "postgresql")) {
    throw "The connection URL must start with postgres:// or postgresql://."
  }
  if ([string]::IsNullOrWhiteSpace($connection.Host)) {
    throw "The connection URL does not contain a database host."
  }
  if ($connection.Host -in @("localhost", "127.0.0.1", "::1") -or $connection.Host -notmatch "\.") {
    throw "This is not an External Database URL. Copy the external URL from the database provider and try again."
  }

  $userInfoSeparator = $connection.UserInfo.IndexOf(":")
  if ($userInfoSeparator -le 0) {
    throw "The connection URL must contain both a database username and password."
  }
  $databaseUser = [Uri]::UnescapeDataString($connection.UserInfo.Substring(0, $userInfoSeparator))
  $databasePassword = [Uri]::UnescapeDataString($connection.UserInfo.Substring($userInfoSeparator + 1))
  $databaseName = [Uri]::UnescapeDataString($connection.AbsolutePath.TrimStart("/"))
  $databasePort = if ($connection.Port -gt 0) { $connection.Port } else { 5432 }
  $connectionUrl = $null
  if ([string]::IsNullOrWhiteSpace($databaseUser) -or
      [string]::IsNullOrWhiteSpace($databasePassword) -or
      [string]::IsNullOrWhiteSpace($databaseName)) {
    throw "The connection URL must contain a database username, password, and database name."
  }

  if (Test-Path -LiteralPath $outputPath) {
    $overwrite = Read-Host "The aggregate export already exists. Type OVERWRITE to replace it"
    if ($overwrite -cne "OVERWRITE") {
      throw "Export cancelled. The existing output file was not changed."
    }
  }
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

  $sql = Get-Content -LiteralPath $scriptPath -Raw
  $readOnlySql = @"
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';
$sql
COMMIT;
"@

  # Docker inherits these values by name, so the password is not placed in its command arguments.
  $env:PGPASSWORD = $databasePassword
  $env:PGSSLMODE = "require"
  $env:PGOPTIONS = "-c default_transaction_read_only=on -c statement_timeout=60000 -c lock_timeout=5000"
  $result = $readOnlySql | docker run --rm -i `
    --env PGPASSWORD --env PGSSLMODE --env PGOPTIONS `
    postgres:18 psql `
    --host $connection.Host --port $databasePort --username $databaseUser `
    --dbname $databaseName --no-password -X -v ON_ERROR_STOP=1 -t -A
  if ($LASTEXITCODE -ne 0) {
    throw "The read-only aggregate query failed. No output file was written."
  }

  $json = ($result -join "`n").Trim()
  if ([string]::IsNullOrWhiteSpace($json)) {
    throw "The query returned no output. No output file was written."
  }
  if ([Text.Encoding]::UTF8.GetByteCount($json) -gt 5MB) {
    throw "The aggregate output exceeded the 5 MB safety limit. No output file was written."
  }
  try {
    $document = $json | ConvertFrom-Json
  } catch {
    throw "The database returned invalid JSON. No output file was written."
  }

  $expectedProperties = @(
    "schema_version", "minimum_count", "alumni_total", "education_total",
    "career_total", "cohorts", "countries", "universities",
    "fields_of_study", "field_mix_by_cohort", "industries", "role_types"
  )
  $actualProperties = @($document.PSObject.Properties.Name)
  $missingProperties = @($expectedProperties | Where-Object { $_ -notin $actualProperties })
  $unexpectedProperties = @($actualProperties | Where-Object { $_ -notin $expectedProperties })
  if ($missingProperties.Count -gt 0 -or $unexpectedProperties.Count -gt 0) {
    throw "The aggregate JSON schema was unexpected. No output file was written."
  }
  if ($document.schema_version -ne 1 -or
      $document.minimum_count -lt 3 -or
      $document.alumni_total -lt 0 -or
      $document.education_total -lt 0 -or
      $document.career_total -lt 0) {
    throw "The aggregate JSON failed its safety checks. No output file was written."
  }

  $temporaryPath = Join-Path $outputDirectory (".stats-aggregates-{0}.tmp" -f [Guid]::NewGuid())
  $utf8WithoutBom = New-Object Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($temporaryPath, $json, $utf8WithoutBom)
  Move-Item -LiteralPath $temporaryPath -Destination $outputPath -Force
  $temporaryPath = $null
  Write-Host "Created validated aggregate-only $targetEnvironment export: $outputPath"
} finally {
  if ($temporaryPath -and (Test-Path -LiteralPath $temporaryPath)) {
    Remove-Item -LiteralPath $temporaryPath -Force
  }
  $env:PGPASSWORD = $previousPassword
  $env:PGSSLMODE = $previousSslMode
  $env:PGOPTIONS = $previousOptions
  $databasePassword = $null
  $connectionUrl = $null
}
