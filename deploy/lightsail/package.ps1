[CmdletBinding()]
param(
    [string]$OutputDirectory = (Join-Path $env:TEMP 'dtms-deploy')
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
$archive = Join-Path $outputRoot 'dtms-release.tar.gz'
$buildRoot = Join-Path $projectRoot 'public/build'
$buildPrefix = [IO.Path]::GetFullPath($buildRoot) + [IO.Path]::DirectorySeparatorChar
if (($outputRoot + [IO.Path]::DirectorySeparatorChar).StartsWith($buildPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Choose an output directory outside public/build.'
}

Push-Location $projectRoot
try {
    & npm.cmd run types:check
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript checks failed.' }

    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }

    $manifest = Get-Content (Join-Path $buildRoot 'manifest.json') -Raw | ConvertFrom-Json
    foreach ($entry in @('resources/js/app.tsx', 'resources/css/app.css')) {
        if ($null -eq $manifest.PSObject.Properties[$entry]) {
            throw "Build is missing $entry."
        }
    }

    $assets = @()
    foreach ($chunk in $manifest.PSObject.Properties.Value) {
        $assets += $chunk.file
        $assets += $chunk.css
        $assets += $chunk.assets
    }
    $fonts = Get-Content (Join-Path $buildRoot 'fonts-manifest.json') -Raw | ConvertFrom-Json
    $assets += $fonts.style.file
    $assets += $fonts.preloads | ForEach-Object { $_.file }
    foreach ($style in $fonts.style.familyStyles.PSObject.Properties.Value) {
        foreach ($match in [regex]::Matches($style, '/build/([^"\s)]+)')) {
            $assets += $match.Groups[1].Value
        }
    }
    foreach ($asset in ($assets | Where-Object { $_ } | Sort-Object -Unique)) {
        $assetPath = [IO.Path]::GetFullPath((Join-Path $buildRoot $asset))
        if (-not $assetPath.StartsWith($buildPrefix, [StringComparison]::OrdinalIgnoreCase) -or
            -not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
            throw "Build asset missing or invalid: $asset"
        }
    }

    # Linux helpers must also work when copied directly from a Windows checkout.
    foreach ($script in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.sh') {
        $content = [IO.File]::ReadAllText($script.FullName).Replace("`r`n", "`n")
        [IO.File]::WriteAllText($script.FullName, $content, [Text.UTF8Encoding]::new($false))
    }

    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
    $deploymentFiles = @(
        'README.md', 'OCR.md', 'update.sh', 'setup.sh', 'setup-ocr.sh',
        'queue.service', 'ocr.service', 'tdms.conf', 'php-fpm.conf', 'mysql.cnf',
        'env.production.example', 'env.ocr.example', 'package.ps1'
    ) | ForEach-Object { "lightsail/$_" }
    & tar.exe -czf $archive -C (Join-Path $projectRoot 'public') build -C (Join-Path $projectRoot 'deploy') @deploymentFiles
    if ($LASTEXITCODE -ne 0) { throw 'Release archive creation failed.' }

    $checksum = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText("$archive.sha256", "$checksum  dtms-release.tar.gz`n", [Text.UTF8Encoding]::new($false))

    $changes = @(git status --porcelain --untracked-files=normal)
    if ($LASTEXITCODE -ne 0) { throw 'Could not check the source checkout.' }
    if ($changes.Count -gt 0) {
        Write-Warning 'The working tree has uncommitted changes. Commit and push the matching source before deploying. Repackage if application source changes.'
    }

    Write-Host "Release: $archive"
    Write-Host "Checksum: $archive.sha256"
    Write-Host 'Contains build/ and lightsail/ only. Application source must be deployed through Git.'
}
finally {
    Pop-Location
}
