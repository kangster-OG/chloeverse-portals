$ErrorActionPreference = "Stop"

function Assert-Contains {
  param(
    [string]$Body,
    [string]$Needle,
    [string]$Context
  )
  if (-not $Body.Contains($Needle)) {
    throw "Missing marker '$Needle' in $Context"
  }
}

function Get-HeadlessBrowser {
  $candidates = @("msedge", "chrome", "chromium", "chromium-browser")
  foreach ($name in $candidates) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
      return $cmd.Source
    }
  }
  return $null
}

function Dump-Dom {
  param(
    [string]$Browser,
    [string]$Url
  )

  $attempts = @(
    @("--headless=new", "--disable-gpu", "--virtual-time-budget=12000", "--dump-dom", $Url),
    @("--headless", "--disable-gpu", "--virtual-time-budget=12000", "--dump-dom", $Url)
  )

  foreach ($args in $attempts) {
    try {
      $dom = & $Browser @args 2>$null
      if ($LASTEXITCODE -eq 0 -and $dom) {
        return ($dom -join "`n")
      }
    } catch {
      continue
    }
  }

  throw "Could not dump DOM for $Url with $Browser"
}

$hostName = "127.0.0.1"
$port = 4310
$baseUrl = "http://$hostName`:$port"

Write-Host "Running collabs lint scope..."
& node node_modules/eslint/bin/eslint.js src/app/collabs src/components/collabs
if ($LASTEXITCODE -ne 0) { throw "Lint failed." }

Write-Host "Running collabs typecheck scope..."
& node node_modules/typescript/bin/tsc -p tsconfig.collabs.json --noEmit
if ($LASTEXITCODE -ne 0) { throw "Typecheck failed." }

Write-Host "Running build (best effort in offline env)..."
$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$buildOutput = & node node_modules/next/dist/bin/next build 2>&1
$buildExitCode = $LASTEXITCODE
$ErrorActionPreference = $prevErrorAction
$buildText = ($buildOutput -join "`n")
if ($buildExitCode -ne 0) {
  if (($buildText.Contains("Failed to fetch") -and $buildText.Contains("Google Fonts")) -or $buildText.Contains("spawn EPERM")) {
    Write-Host "WARNING: Build skipped due to environment restrictions (offline fonts or process spawn limits)."
  } else {
    Write-Output $buildOutput
    throw "Build failed."
  }
}

$stdoutFile = Join-Path $env:TEMP "collabs-dev-stdout.log"
$stderrFile = Join-Path $env:TEMP "collabs-dev-stderr.log"
if (Test-Path $stdoutFile) { Remove-Item $stdoutFile -Force }
if (Test-Path $stderrFile) { Remove-Item $stderrFile -Force }

$server = $null
try {
  Write-Host "Starting dev server for smoke checks..."
  $server = Start-Process -FilePath node -ArgumentList @("node_modules/next/dist/bin/next", "dev", "-p", "$port", "-H", "$hostName") -PassThru -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile -WindowStyle Hidden

  $ready = $false
  $devStartBlocked = $false
  for ($i = 0; $i -lt 180; $i++) {
    if ($server.HasExited) {
      $stderrNow = ""
      if (Test-Path $stderrFile) {
        $stderrNow = (Get-Content $stderrFile -Raw)
      }
      if ($stderrNow.Contains("spawn EPERM")) {
        Write-Host "WARNING: Smoke checks skipped due to environment process spawn limits."
        $devStartBlocked = $true
        break
      }
    }
    try {
      $resp = Invoke-WebRequest -Uri "$baseUrl/collabs" -UseBasicParsing -TimeoutSec 2
      if ($resp.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  if ($devStartBlocked) {
    return
  }
  if (-not $ready) {
    throw "Dev server did not start in time."
  }

  $collabsHtml = (Invoke-WebRequest -Uri "$baseUrl/collabs" -UseBasicParsing -TimeoutSec 10).Content
  Assert-Contains -Body $collabsHtml -Needle 'data-collabs-page="landing"' -Context "/collabs HTML"
  Assert-Contains -Body $collabsHtml -Needle 'data-collabs-ui="landing"' -Context "/collabs HTML"
  Assert-Contains -Body $collabsHtml -Needle "data-collabs-cta" -Context "/collabs HTML"

  $reelsHtml = (Invoke-WebRequest -Uri "$baseUrl/collabs/reels" -UseBasicParsing -TimeoutSec 10).Content
  Assert-Contains -Body $reelsHtml -Needle 'data-collabs-page="reels"' -Context "/collabs/reels HTML"
  Assert-Contains -Body $reelsHtml -Needle 'data-collabs-ui="reels-gallery"' -Context "/collabs/reels HTML"
  Assert-Contains -Body $reelsHtml -Needle 'data-collabs-marker="reels-corridor"' -Context "/collabs/reels HTML"

  $browser = Get-HeadlessBrowser
  if (-not $browser) {
    throw "No supported headless browser found (msedge/chrome/chromium)."
  }

  $ctaDom = Dump-Dom -Browser $browser -Url "$baseUrl/collabs?__collabsSmoke=1&__action=cta"
  Assert-Contains -Body $ctaDom -Needle 'data-collabs-page="reels"' -Context "CTA smoke DOM"
  Assert-Contains -Body $ctaDom -Needle 'data-collabs-ui="reels-gallery"' -Context "CTA smoke DOM"
  Assert-Contains -Body $ctaDom -Needle 'data-collabs-shell-mounts="1"' -Context "CTA smoke DOM"

  $modalDom = Dump-Dom -Browser $browser -Url "$baseUrl/collabs/reels?__collabsSmoke=1&__action=open-frame"
  Assert-Contains -Body $modalDom -Needle 'data-collabs-modal="open"' -Context "Frame click DOM"
  Assert-Contains -Body $modalDom -Needle 'role="dialog"' -Context "Frame click DOM"
  Assert-Contains -Body $modalDom -Needle "data-phone-shell" -Context "Frame click DOM"

  Write-Host "Collabs smoke checks passed."
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}
