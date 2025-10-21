# Activate project venv for this PowerShell session without modifying the global profile.
# Usage: .\activate_venv.ps1  (dot-source it in your shell: `. .\activate_venv.ps1`)

$venvPath = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'

if (-Not (Test-Path $venvPath)) {
    Write-Error "Virtualenv python not found at $venvPath. Ensure .venv exists in the repo root."
    return
}

# Define a session-only 'python' function that forwards to the venv python
function python {
    param([Parameter(ValueFromRemainingArguments = $true)] $args)
    & (Resolve-Path $venvPath).Path @args
}

Write-Host "Session 'python' ->" (Resolve-Path $venvPath).Path -ForegroundColor Green
Write-Host "You can now run: python manage.py runserver" -ForegroundColor Yellow
