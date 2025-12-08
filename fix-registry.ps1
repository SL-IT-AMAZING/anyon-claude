# Fix Deep Link registry path
$exePath = "C:\Users\GoGo\Desktop\anyon-claude\src-tauri\target\debug\anyon.exe"
$regPath = "HKCU:\Software\Classes\anyon\shell\open\command"

# Set the command
Set-ItemProperty -Path $regPath -Name "(default)" -Value "`"$exePath`" `"%1`""

Write-Host "Registry updated successfully!"
Write-Host "New path: $exePath"

# Verify
$currentValue = Get-ItemProperty -Path $regPath | Select-Object -ExpandProperty "(default)"
Write-Host "Current registry value: $currentValue"
