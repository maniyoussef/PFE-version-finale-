using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.Services;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;
using SimSoftAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Configure CORS
builder.Services.AddCors(options => 
{
    options.AddDefaultPolicy(builder =>
    {
        builder.SetIsOriginAllowed(origin => true)
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Configure DbContext with MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is missing.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 29)),
        o => {
            o.EnableRetryOnFailure();
            o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        }
    )
);

// Register services
builder.Services.AddScoped<ProblemCategoryService>();
builder.Services.AddScoped<TicketService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordGeneratorService, PasswordGeneratorService>();
builder.Services.AddScoped<DatabaseCleanupService>();
builder.Services.AddScoped<DatabaseInitializationService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Add controllers and API explorer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// Configure authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    // Generate a default key for development
    jwtKey = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SimSoftAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SimSoftClient",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

// Static files configuration
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot")),
    RequestPath = ""
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads")),
    RequestPath = "/uploads"
});

// Development-specific middleware
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure Database is Created & Initialized
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var dbInitializer = services.GetRequiredService<DatabaseInitializationService>();
    
    try
    {
        await dbInitializer.InitializeDatabaseAsync();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database");
        throw;
    }
}

// Global Exception Handling
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        if (exceptionHandlerPathFeature?.Error != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(exceptionHandlerPathFeature.Error, "Unhandled exception");

            var errorResponse = new
            {
                message = "An unexpected error occurred.",
                details = app.Environment.IsDevelopment() ? exceptionHandlerPathFeature.Error.Message : null
            };
            await context.Response.WriteAsJsonAsync(errorResponse);
        }
    });
});

// HTTP request pipeline configuration
app.UseRouting();

// Add CORS middleware before authentication
app.UseCors();

// Add authentication middleware
app.UseAuthentication();

// Add authorization middleware
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Add endpoint for database reset in development
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/reset-database", async (DatabaseCleanupService cleanupService, ILogger<Program> logger) =>
    {
        try
        {
            logger.LogWarning("Database reset requested");
            await cleanupService.CleanupDatabaseAsync();
            
            // Re-seed minimal data
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                // Seed roles
                dbContext.Roles.AddRange(
                    new SimSoftAPI.Models.Role { Name = "Admin" },
                    new SimSoftAPI.Models.Role { Name = "User" }
                );
                
                // Seed countries
                dbContext.Countries.AddRange(
                    new SimSoftAPI.Models.Country { Name = "United States", Code = "us", Icon = "https://flagcdn.com/48x36/us.png" },
                    new SimSoftAPI.Models.Country { Name = "France", Code = "fr", Icon = "https://flagcdn.com/48x36/fr.png" }
                );
                
                await dbContext.SaveChangesAsync();
            }
            
            logger.LogInformation("Database reset completed successfully");
            return Results.Ok(new { message = "Database reset successful" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during database reset");
            return Results.Problem("Database reset failed: " + ex.Message);
        }
    });
}

app.Run();