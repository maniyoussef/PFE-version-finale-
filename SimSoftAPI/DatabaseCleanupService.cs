using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using System;
using System.Threading.Tasks;

namespace SimSoftAPI.Services
{
    public class DatabaseCleanupService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DatabaseCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public DatabaseCleanupService(AppDbContext context, ILogger<DatabaseCleanupService> logger, IServiceProvider serviceProvider)
        {
            _context = context;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

       public async Task CleanupDatabaseAsync()
{
    try
    {
        _logger.LogInformation("Starting database cleanup");

        // Check if database exists
        var databaseExists = await _context.Database.CanConnectAsync();

        if (databaseExists)
        {
            // Drop the database if it exists
            await _context.Database.EnsureDeletedAsync();
        }

        // Create a new database
        await _context.Database.EnsureCreatedAsync();

        // Reinitialize data
        var dbInitializer = new DatabaseInitializationService(
            _context,
            _serviceProvider.GetRequiredService<ILogger<DatabaseInitializationService>>()
        );
        await dbInitializer.InitializeDatabaseAsync();

        _logger.LogInformation("Database cleanup and reinitialization completed successfully");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during database cleanup");
        throw;
    }
}
    }
}
