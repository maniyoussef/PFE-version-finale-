using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SimSoftAPI.Services
{
    public class DatabaseInitializationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DatabaseInitializationService> _logger;

        public DatabaseInitializationService(AppDbContext context, ILogger<DatabaseInitializationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeDatabaseAsync()
{
    try
    {
        _logger.LogInformation("Starting database initialization");

        // Only apply migrations, don't create database
        await _context.Database.MigrateAsync();

        // Seed initial data if tables are empty
        await SeedInitialDataAsync();

        _logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during database initialization");
        throw;
    }
}

        private async Task CreateTablesAsync()
        {
            try
            {
                // Check if 'Users' table exists before creating it
                var usersTableExists = await _context.Database.ExecuteSqlRawAsync(@"
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_NAME = 'Users' AND TABLE_SCHEMA = DATABASE()") > 0;

                if (!usersTableExists)
                {
                    await _context.Database.ExecuteSqlRawAsync(@"
                        CREATE TABLE IF NOT EXISTS Countries (
                            Id int PRIMARY KEY AUTO_INCREMENT,
                            Name varchar(100) NOT NULL,
                            Code varchar(10) NOT NULL,
                            Icon varchar(255)
                        );

                        CREATE TABLE IF NOT EXISTS Roles (
                            Id int PRIMARY KEY AUTO_INCREMENT,
                            Name varchar(50) NOT NULL
                        );

                      CREATE TABLE IF NOT EXISTS Users (
    Id int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(100) NOT NULL,
    LastName varchar(100) NOT NULL,
    Email varchar(255) NOT NULL,
    CountryId int NOT NULL,
    Password varchar(255),
    RoleId int NOT NULL,
    FOREIGN KEY (CountryId) REFERENCES Countries(Id),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

                        CREATE TABLE IF NOT EXISTS Companies (
                            Id int PRIMARY KEY AUTO_INCREMENT,
                            Name varchar(255) NOT NULL,
                            Address varchar(500),
                            ContactPerson varchar(255) NOT NULL,
                            Email varchar(255) NOT NULL,
                            Phone varchar(50)
                        );

                        CREATE TABLE IF NOT EXISTS Projects (
        Id int PRIMARY KEY AUTO_INCREMENT,
        Name varchar(255) NOT NULL,
        Description text,
        StartDate datetime NOT NULL,
        EndDate datetime
    );

                        CREATE TABLE IF NOT EXISTS ProblemCategories (
                            Id int PRIMARY KEY AUTO_INCREMENT,
                            Name varchar(100) NOT NULL,
                            Description text
                        );

                       // C:\Project fe\Backend\SimSoftAPI\DatabaseInitializationService.cs
// Inside CreateTablesAsync()

CREATE TABLE IF NOT EXISTS Tickets (
    Id int PRIMARY KEY AUTO_INCREMENT,
    Title varchar(255) NOT NULL,
    Description text,
    Status varchar(50) NOT NULL,
    Priority varchar(50) NOT NULL,
    Qualification varchar(255) NOT NULL, // ADD THIS
    CreatedDate datetime NOT NULL,
    ProjectId int NOT NULL,
    ProblemCategoryId int NOT NULL,
    AssignedToId int NOT NULL, // ADD THIS
    FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    FOREIGN KEY (ProblemCategoryId) REFERENCES ProblemCategories(Id),
    FOREIGN KEY (AssignedToId) REFERENCES Users(Id) // ADD THIS
        Commentaire text,  // Add this line

);
                    ");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tables");
                throw;
            }
        }

        public async Task SeedInitialDataAsync()
        {
            if (!_context.Roles.Any())
            {
                _context.Roles.AddRange(
                    new Role { Name = "Admin" },
                    new Role { Name = "User" }
                );
            }

            if (!_context.Countries.Any())
            {
                _context.Countries.AddRange(
                    new Country { Name = "United States", Code = "us", Icon = "https://flagcdn.com/48x36/us.png" }
                );
            }

            if (!_context.Users.Any())
            {
                _context.Users.Add(
                    new User
                    {
                        Id = 1,
                        Name = "Default User",
                        LastName = "Default",
                        Email = "default@example.com",
                        CountryId = 1,
                        RoleId = 1
                    }
                );
            }

            if (!_context.Projects.Any())
            {
                _context.Projects.Add(
                    new Project
                    {
                        Name = "Sample Project",
                        Description = "Sample project for testing",
                        StartDate = new DateTime(2024, 1, 1),
                    }
                );
            }

            if (!_context.ProblemCategories.Any())
            {
                _context.ProblemCategories.Add(
                    new ProblemCategory { Name = "Sample Category" }
                );
            }
              if (!_context.Tickets.Any())
   {
       _context.Tickets.Add(
           new Ticket
           {
               Title = "Sample Ticket",
               Description = "This is a sample ticket for testing",
               Status = "Open",
               Priority = "Medium",
               Qualification = "Ticket Support",
               ProjectId = 1, 
               ProblemCategoryId = 1,
               AssignedToId = 1 // Assumes the default user has ID 1
           }
       );
   }

            await _context.SaveChangesAsync();
        }
    }
}
