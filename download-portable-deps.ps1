# Download and setup portable Git and Node.js for ANYON
# This script automates the download and extraction process

param(
    [switch]$GitOnly,
    [switch]$NodeOnly,
    [string]$GitVersion = "latest",
    [string]$NodeVersion = "latest"
)

$ErrorActionPreference = "Stop"

function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

Write-Info "=== ANYON Portable Dependencies Downloader ==="
Write-Host ""

# Create resources directory
$resourcesDir = "src-tauri\resources"
if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null
    Write-Success "Created resources directory"
}

# Function to download file with progress
function Download-FileWithProgress {
    param(
        [string]$Url,
        [string]$Output
    )

    Write-Info "Downloading: $Url"
    Write-Info "To: $Output"

    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($Url, $Output)
        Write-Success "✓ Download completed"
        return $true
    }
    catch {
        Write-Error "Download failed: $($_.Exception.Message)"
        return $false
    }
}

# Download and setup Git Portable
if (-not $NodeOnly) {
    Write-Info "`n--- Git Portable Setup ---"

    $gitDir = "$resourcesDir\git-portable"
    $gitExe = "$gitDir\cmd\git.exe"

    if (Test-Path $gitExe) {
        Write-Warning "Git Portable already exists at: $gitDir"
        $response = Read-Host "Do you want to re-download? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Skipping Git download"
        }
        else {
            Remove-Item $gitDir -Recurse -Force
        }
    }

    if (-not (Test-Path $gitExe)) {
        Write-Info "Detecting latest Git Portable version..."

        # Get latest release info
        try {
            $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/git-for-windows/git/releases/latest"
            $asset = $releases.assets | Where-Object { $_.name -like "*PortableGit-*-64-bit.7z.exe" } | Select-Object -First 1

            if (-not $asset) {
                Write-Error "Could not find PortableGit download"
                Write-Info "Please download manually from: https://github.com/git-for-windows/git/releases/latest"
                exit 1
            }

            $gitUrl = $asset.browser_download_url
            $gitFile = "$env:TEMP\$($asset.name)"

            Write-Info "Latest version: $($releases.tag_name)"
            Write-Info "File: $($asset.name)"
            Write-Info "Size: $([math]::Round($asset.size / 1MB, 2)) MB"

            # Download
            if (Download-FileWithProgress -Url $gitUrl -Output $gitFile) {
                # Extract
                Write-Info "Extracting Git Portable..."
                New-Item -ItemType Directory -Path $gitDir -Force | Out-Null

                # The file is a self-extracting 7z, run it with -o flag
                $extractArgs = "-o`"$gitDir`" -y"
                Start-Process -FilePath $gitFile -ArgumentList $extractArgs -Wait -NoNewWindow

                if (Test-Path $gitExe) {
                    Write-Success "✓ Git Portable installed successfully"

                    # Test git
                    $gitOutput = & $gitExe --version
                    Write-Info "Git version: $gitOutput"

                    # Cleanup
                    Remove-Item $gitFile -Force
                }
                else {
                    Write-Error "Extraction failed. Git executable not found."
                }
            }
        }
        catch {
            Write-Error "Failed to download Git: $($_.Exception.Message)"
            Write-Info "Please download manually from: https://github.com/git-for-windows/git/releases/latest"
        }
    }
}

# Download and setup Node.js Portable
if (-not $GitOnly) {
    Write-Info "`n--- Node.js Portable Setup ---"

    $nodeDir = "$resourcesDir\node-portable"
    $nodeExe = "$nodeDir\node.exe"

    if (Test-Path $nodeExe) {
        Write-Warning "Node.js Portable already exists at: $nodeDir"
        $response = Read-Host "Do you want to re-download? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Skipping Node.js download"
        }
        else {
            Remove-Item $nodeDir -Recurse -Force
        }
    }

    if (-not (Test-Path $nodeExe)) {
        Write-Info "Detecting latest Node.js LTS version..."

        try {
            # Get latest LTS version
            $nodeIndex = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json"
            $ltsVersion = $nodeIndex | Where-Object { $_.lts } | Select-Object -First 1

            if (-not $ltsVersion) {
                Write-Error "Could not find Node.js LTS version"
                Write-Info "Please download manually from: https://nodejs.org/dist/latest/"
                exit 1
            }

            $nodeUrl = "https://nodejs.org/dist/$($ltsVersion.version)/node-$($ltsVersion.version)-win-x64.zip"
            $nodeFile = "$env:TEMP\node-$($ltsVersion.version)-win-x64.zip"

            Write-Info "Latest LTS version: $($ltsVersion.version) ($($ltsVersion.lts))"
            Write-Info "File: node-$($ltsVersion.version)-win-x64.zip"

            # Download
            if (Download-FileWithProgress -Url $nodeUrl -Output $nodeFile) {
                # Extract
                Write-Info "Extracting Node.js..."
                $tempExtractDir = "$env:TEMP\node-extract-$([guid]::NewGuid().ToString())"
                Expand-Archive -Path $nodeFile -DestinationPath $tempExtractDir -Force

                # Move to final location
                $extractedFolder = Get-ChildItem $tempExtractDir | Select-Object -First 1
                Move-Item $extractedFolder.FullName $nodeDir -Force

                if (Test-Path $nodeExe) {
                    Write-Success "✓ Node.js Portable installed successfully"

                    # Test node
                    $nodeOutput = & $nodeExe --version
                    Write-Info "Node version: $nodeOutput"

                    # Test npm
                    $npmCmd = "$nodeDir\npm.cmd"
                    if (Test-Path $npmCmd) {
                        $npmOutput = & cmd /c "`"$npmCmd`" --version"
                        Write-Info "NPM version: $npmOutput"
                    }

                    # Test npx
                    $npxCmd = "$nodeDir\npx.cmd"
                    if (Test-Path $npxCmd) {
                        Write-Success "✓ NPX found"
                    }

                    # Cleanup
                    Remove-Item $nodeFile -Force
                    Remove-Item $tempExtractDir -Recurse -Force
                }
                else {
                    Write-Error "Extraction failed. Node executable not found."
                }
            }
        }
        catch {
            Write-Error "Failed to download Node.js: $($_.Exception.Message)"
            Write-Info "Please download manually from: https://nodejs.org/dist/latest/"
        }
    }
}

# Summary
Write-Host ""
Write-Info "=== Setup Summary ==="

$gitExePath = "$resourcesDir\git-portable\cmd\git.exe"
$nodeExePath = "$resourcesDir\node-portable\node.exe"
$npxExePath = "$resourcesDir\node-portable\npx.cmd"

if (Test-Path $gitExePath) {
    Write-Success "✓ Git Portable: Ready"
}
else {
    Write-Warning "✗ Git Portable: Not found"
}

if (Test-Path $nodeExePath) {
    Write-Success "✓ Node.js Portable: Ready"
}
else {
    Write-Warning "✗ Node.js Portable: Not found"
}

if ((Test-Path $gitExePath) -and (Test-Path $nodeExePath)) {
    Write-Host ""
    Write-Success "All dependencies ready!"
    Write-Info "You can now run: .\build-installer.ps1"
}
else {
    Write-Host ""
    Write-Warning "Some dependencies are missing. Please install them manually."
}

Write-Host ""
