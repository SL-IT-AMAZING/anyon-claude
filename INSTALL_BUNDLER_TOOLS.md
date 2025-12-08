# Install Windows Bundler Tools

The build process reported success but the MSI and NSIS installers weren't created because the required bundler tools are not installed on this system.

## Required Tools

### 1. WiX Toolset (for MSI installers)

**Download and Install:**
- Official releases: https://github.com/wixtoolset/wix3/releases
- Download: `wix314.exe` (WiX v3.14 - stable version for Tauri)
- Run the installer and follow the installation wizard
- Make sure to add WiX to PATH during installation

**Alternative (via .NET tool):**
```powershell
dotnet tool install --global wix
```

**Verify Installation:**
```powershell
where light.exe
# Should show: C:\Program Files (x86)\WiX Toolset v3.14\bin\light.exe
```

More info: https://www.firegiant.com/wixtoolset/

### 2. NSIS (for NSIS installers)

**Download and Install:**
- Official download: https://nsis.sourceforge.io/Download
- SourceForge: https://sourceforge.net/projects/nsis/
- Download the latest version (NSIS 3.11 or newer)
- Run the installer and follow the installation wizard
- Add NSIS to PATH during installation

**Verify Installation:**
```powershell
where makensis.exe
# Should show: C:\Program Files (x86)\NSIS\makensis.exe
```

More info: https://nsis.sourceforge.io/Main_Page

## After Installation

1. **Close and reopen** your terminal/PowerShell to refresh PATH
2. **Verify both tools are accessible:**
   ```powershell
   where light.exe
   where makensis.exe
   ```
3. **Rebuild the project:**
   ```powershell
   cd src-tauri
   cargo tauri build
   ```

## Expected Output

After successful installation, the build should create:
- `src-tauri/target/release/bundle/msi/ANYON_0.2.1_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/ANYON_0.2.1_x64-setup.exe`

Both installers will include the bundled Git and Node.js portable versions (~96MB each).

## Notes

- WiX Toolset requires .NET Framework 3.5 or later
- NSIS has no special dependencies
- Both tools are free and open source
- You only need to install these once on your development machine
