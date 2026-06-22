$ErrorActionPreference = "Stop"

$repoZip = "https://github.com/AmirHosein-Lotfi/Camel/archive/refs/heads/main.zip"
$skillsDir = if ($env:CLAUDE_SKILLS_DIR) { $env:CLAUDE_SKILLS_DIR } else { "$HOME\.claude\skills" }
$skills = @("camel", "camel-dam", "camel-pro")

$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid())
New-Item -ItemType Directory -Path $tmpDir | Out-Null
$zipPath = Join-Path $tmpDir "camel.zip"

try {
    Write-Host "Downloading camel..."
    Invoke-WebRequest -Uri $repoZip -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $tmpDir

    $extracted = Join-Path $tmpDir "Camel-main"
    New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null

    foreach ($skill in $skills) {
        $dest = Join-Path $skillsDir $skill
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Copy-Item -Recurse (Join-Path $extracted $skill) $dest
        Write-Host "Installed $skill -> $dest"
    }

    Write-Host "Done. Restart Claude Code, then try /camel, /camel-dam, or /camel-pro."
}
finally {
    Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
}
