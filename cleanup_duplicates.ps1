# Cleanup script for TicketManagementFrontEnd
# This script will remove duplicate components that are not in use

Write-Host "Starting cleanup of duplicate components..." -ForegroundColor Cyan

# Set the base path
$basePath = "C:\Project fe\TicketManagementFrontEnd\src\app"

# Files to delete (unused duplicates)
$filesToDelete = @(
    # Unused login components (using the one in features/auth/login)
    "$basePath\components\login",
    "$basePath\components\login.component",
    
    # Unused logout components
    "$basePath\components\logout",
    "$basePath\components\logout.component",
    
    # Unused admin routes (using pages/admin/admin.routes.ts)
    "$basePath\features\admin"
)

# Check each path and delete if it exists
foreach ($path in $filesToDelete) {
    if (Test-Path -Path $path) {
        Write-Host "Removing $path..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $path -Recurse -Force
            Write-Host "Successfully removed $path" -ForegroundColor Green
        } catch {
            Write-Host "Error removing $path: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Path not found: $path" -ForegroundColor Gray
    }
}

Write-Host "Cleanup completed!" -ForegroundColor Cyan
Write-Host "Kept components:" -ForegroundColor Green
Write-Host "- features/auth/login/login.component.ts (active login component)" -ForegroundColor Green
Write-Host "- pages/admin/admin.routes.ts (active admin routes)" -ForegroundColor Green 