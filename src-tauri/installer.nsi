; ANYON Installer Script for NSIS
; This script creates a Windows installer that bundles Git and Node.js

!include "MUI2.nsh"
!include "FileFunc.nsh"

; General Settings
Name "ANYON"
OutFile "ANYON-Setup.exe"
InstallDir "$PROGRAMFILES64\ANYON"
InstallDirRegKey HKLM "Software\ANYON" "Install_Dir"
RequestExecutionLevel admin

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "icons\icon.ico"
!define MUI_UNICON "icons\icon.ico"

; Pages
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Korean"

; Version Information
VIProductVersion "0.2.1.0"
VIAddVersionKey "ProductName" "ANYON"
VIAddVersionKey "CompanyName" "ANYON"
VIAddVersionKey "LegalCopyright" "© 2025 ANYON. All rights reserved."
VIAddVersionKey "FileDescription" "ANYON Installer"
VIAddVersionKey "FileVersion" "0.2.1.0"

Section "ANYON" SecMain
    SectionIn RO

    SetOutPath "$INSTDIR"

    ; Install main application
    File /r "release\*.*"

    ; Install Git Portable (if exists)
    ${If} ${FileExists} "resources\git-portable\*.*"
        DetailPrint "Installing bundled Git..."
        SetOutPath "$INSTDIR\resources\git-portable"
        File /r "resources\git-portable\*.*"
    ${EndIf}

    ; Install Node.js Portable (if exists)
    ${If} ${FileExists} "resources\node-portable\*.*"
        DetailPrint "Installing bundled Node.js..."
        SetOutPath "$INSTDIR\resources\node-portable"
        File /r "resources\node-portable\*.*"
    ${EndIf}

    ; Write registry keys
    WriteRegStr HKLM "Software\ANYON" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "DisplayName" "ANYON"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "UninstallString" '"$INSTDIR\Uninstall.exe"'
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "DisplayIcon" "$INSTDIR\ANYON.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "Publisher" "ANYON"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "DisplayVersion" "0.2.1"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON" "NoRepair" 1

    ; Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Create Start Menu shortcuts
    CreateDirectory "$SMPROGRAMS\ANYON"
    CreateShortcut "$SMPROGRAMS\ANYON\ANYON.lnk" "$INSTDIR\ANYON.exe"
    CreateShortcut "$SMPROGRAMS\ANYON\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

    ; Create Desktop shortcut
    CreateShortcut "$DESKTOP\ANYON.lnk" "$INSTDIR\ANYON.exe"

SectionEnd

Section "Uninstall"
    ; Remove registry keys
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\ANYON"
    DeleteRegKey HKLM "Software\ANYON"

    ; Remove shortcuts
    Delete "$DESKTOP\ANYON.lnk"
    Delete "$SMPROGRAMS\ANYON\*.*"
    RMDir "$SMPROGRAMS\ANYON"

    ; Remove installation directory
    RMDir /r "$INSTDIR"

SectionEnd
