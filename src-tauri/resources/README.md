# Portable Dependencies

This directory contains portable versions of Git and Node.js that are bundled with the application.

## Setup Instructions

### 1. Git Portable
Download PortableGit (64-bit) from:
https://github.com/git-for-windows/git/releases/latest

- Download: `PortableGit-*-64-bit.7z.exe`
- Extract to: `git-portable/`
- After extraction, you should have: `git-portable/cmd/git.exe`

### 2. Node.js Portable
Download Node.js Windows Binary (x64) from:
https://nodejs.org/dist/latest/

- Download: `node-v*-win-x64.zip`
- Extract to: `node-portable/`
- After extraction, you should have:
  - `node-portable/node.exe`
  - `node-portable/npm`
  - `node-portable/npx`
  - `node-portable/node_modules/`

## Directory Structure

```
resources/
├── git-portable/
│   ├── cmd/
│   │   └── git.exe
│   ├── bin/
│   ├── mingw64/
│   └── ... (other git files)
└── node-portable/
    ├── node.exe
    ├── npm
    ├── npm.cmd
    ├── npx
    ├── npx.cmd
    └── node_modules/
```

## Note
These files are NOT committed to git due to their size. You must download and set them up locally before building the installer.
