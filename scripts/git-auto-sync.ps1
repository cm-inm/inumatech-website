param(
    [string]$RepositoryPath = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Continue'
$gitPath = 'C:\Program Files\Git\cmd\git.exe'
$logPath = Join-Path $RepositoryPath '.git\auto-sync.log'
$lockPath = Join-Path $RepositoryPath '.git\auto-sync.lock'

if (-not (Test-Path -LiteralPath $gitPath) -or -not (Test-Path -LiteralPath (Join-Path $RepositoryPath '.git'))) {
    exit 1
}

try {
    $lockStream = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
} catch {
    exit 0
}

function Write-SyncLog([string]$Message) {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -LiteralPath $logPath -Value "$timestamp $Message"
}

function Invoke-Git([string[]]$Arguments) {
    & $gitPath -C $RepositoryPath @Arguments 2>&1 | ForEach-Object { Write-SyncLog $_ }
    return $LASTEXITCODE
}

function Sync-Repository {
    $status = & $gitPath -C $RepositoryPath status --porcelain
    if (-not $status) { return }

    Write-SyncLog 'Detected local changes; synchronizing.'
    if ((Invoke-Git @('add', '--all')) -ne 0) { return }

    $message = 'Auto-sync local changes ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    if ((Invoke-Git @('commit', '-m', $message)) -ne 0) { return }
    if ((Invoke-Git @('pull', '--rebase', 'origin', 'main')) -ne 0) {
        Write-SyncLog 'Pull/rebase failed; push was skipped to preserve both histories.'
        return
    }
    if ((Invoke-Git @('push', 'origin', 'main')) -eq 0) {
        Write-SyncLog 'Synchronization completed.'
    }
}

try {
    Sync-Repository
} finally {
    $lockStream.Dispose()
}
