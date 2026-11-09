# Builds the site into _site\ so you can upload it anywhere.
# Run it with "BUILD SITE.bat" in the repo folder.
$ErrorActionPreference = 'Continue'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo
$env:PYTHONUTF8 = '1'

if (Get-Command py -ErrorAction SilentlyContinue) { $py = 'py'; $pyArgs = @('-3') }
else { $py = 'python'; $pyArgs = @() }

& $py @pyArgs -c "import pypdf" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Installing pypdf (reads PDF titles)...'
    & $py @pyArgs -m pip install --user --quiet --disable-pip-version-check pypdf
}

Write-Host ''
Write-Host 'Building the site (fetching Are.na images, tarot deck and playlist)...' -ForegroundColor Cyan
& $py @pyArgs build.py
if ($LASTEXITCODE -ne 0) { Write-Host 'build.py failed, see above.' -ForegroundColor Red; exit 1 }
& $py @pyArgs tools\package_site.py
if ($LASTEXITCODE -ne 0) { Write-Host 'Packaging failed, see above.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host "Done. Upload this folder: $repo\_site" -ForegroundColor Green
Write-Host 'Cloudflare: Workers & Pages > your jerelevance project > Create new deployment > drag _site in.'
Start-Process explorer.exe (Join-Path $repo '_site')
