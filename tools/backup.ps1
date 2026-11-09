# Saves the whole repo (every commit, every branch) as one file in Proton Drive.
# Restore anywhere with:  git clone <file>.bundle jere.ing
$ErrorActionPreference = 'Continue'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo
$dir = git config jere.backupdir
if (-not $dir) { Write-Host 'No backup folder set. Run the setup script again.' -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir ("jere-ing-" + (Get-Date -Format 'yyyy-MM-dd') + ".bundle")
git bundle create $file --all
if ($LASTEXITCODE -ne 0) { Write-Host 'Backup failed, see above.' -ForegroundColor Red; exit 1 }
# keep the 14 newest dated backups
Get-ChildItem $dir -Filter 'jere-ing-20*.bundle' | Sort-Object Name -Descending | Select-Object -Skip 14 | Remove-Item
Write-Host "Backed up to $file" -ForegroundColor Green
