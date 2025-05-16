using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SimSoftAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RolesController> _logger;

        public RolesController(AppDbContext context, ILogger<RolesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
        {
            return await _context.Roles.ToListAsync();
        }

        [HttpGet("reset")]
        public async Task<ActionResult<string>> ResetRolesToExactNames()
        {
            _logger.LogInformation("Starting role reset to ensure exact matches");
            
            // Define the exact role names that your application requires
            var requiredRoles = new Dictionary<string, string> {
                { "Admin", "Admin" },
                { "User", "User" },
                { "Chef Projet", "Chef Projet" },
                { "Collaborateur", "Collaborateur" },
                { "Client", "Client" }
            };
            
            // Get existing roles
            var existingRoles = await _context.Roles.ToListAsync();
            
            // First, update any roles that have similar names to ensure exact matches
            foreach (var role in existingRoles)
            {
                var matchingRequiredRole = requiredRoles.FirstOrDefault(r => 
                    string.Equals(r.Key, role.Name, StringComparison.OrdinalIgnoreCase) || 
                    r.Key.Replace(" ", "").Equals(role.Name.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));
                
                if (!string.IsNullOrEmpty(matchingRequiredRole.Key) && role.Name != matchingRequiredRole.Value)
                {
                    _logger.LogInformation($"Updating role name from '{role.Name}' to exact match '{matchingRequiredRole.Value}'");
                    role.Name = matchingRequiredRole.Value;
                    requiredRoles.Remove(matchingRequiredRole.Key);
                }
            }
            
            // Add any missing roles
            foreach (var roleName in requiredRoles.Values)
            {
                if (!existingRoles.Any(r => r.Name == roleName))
                {
                    _logger.LogInformation($"Creating missing role: {roleName}");
                    _context.Roles.Add(new Role { Name = roleName });
                }
            }
            
            await _context.SaveChangesAsync();
            
            return Ok("Roles have been reset to exact required names.");
        }
    }
} 