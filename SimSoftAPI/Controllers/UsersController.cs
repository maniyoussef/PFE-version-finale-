using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.DTOs;
using SimSoftAPI.Models;
using SimSoftAPI.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UsersController> _logger;
        private readonly IPasswordGeneratorService _passwordGenerator;
        private readonly IEmailService _emailService;

        public UsersController(
            AppDbContext context,
            ILogger<UsersController> logger,
            IPasswordGeneratorService passwordGenerator,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _passwordGenerator = passwordGenerator;
            _emailService = emailService;
        }

        #region DTOs
        public class ChangePasswordDto
        {
            [Required]
            public string OldPassword { get; set; } = string.Empty;
            
            [Required]
            public string NewPassword { get; set; } = string.Empty;
        }

        public class AssignCollaborateurToChefDto
        {
            [Required]
            public int CollaborateurId { get; set; }
        }

        public class CreateUserDto
        {
            [Required]
            public string Name { get; set; } = string.Empty;
            
            [Required]
            public string LastName { get; set; } = string.Empty;
            
            [Required]
            [EmailAddress]
            public string Email { get; set; } = string.Empty;
            
            [Required]
            public int CountryId { get; set; }
            
            [Required]
            public int RoleId { get; set; }
        }

        public class RemoveCollaborateurFromChefDto
        {
            public int ChefProjetId { get; set; }
        }
        #endregion

        #region User Endpoints
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Country)
                    .Include(u => u.Role)
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.Companies)
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving users: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Country)
                    .Include(u => u.Role)
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.Companies)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    return NotFound();
                }

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving user {id}: {ex.Message}");
                return StatusCode(500, $"Internal server error while retrieving user {id}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var countryExists = await _context.Countries.AnyAsync(c => c.Id == createUserDto.CountryId);
                var roleExists = await _context.Roles.AnyAsync(r => r.Id == createUserDto.RoleId);

                if (!countryExists)
                    return BadRequest($"Country with ID {createUserDto.CountryId} does not exist");
                
                if (!roleExists)
                    return BadRequest($"Role with ID {createUserDto.RoleId} does not exist");

                if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
                    return Conflict($"Email {createUserDto.Email} already exists");

                var password = _passwordGenerator.GeneratePassword();

                var user = new User
                {
                    Name = createUserDto.Name,
                    LastName = createUserDto.LastName,
                    Email = createUserDto.Email,
                    CountryId = createUserDto.CountryId,
                    RoleId = createUserDto.RoleId,
                    PasswordHash = HashPassword(password)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                await _emailService.SendUserCredentialsAsync(
                    user.Email, 
                    user.Email, 
                    password
                );

                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error creating user: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateDto userUpdateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existingUser = await _context.Users
                    .Include(u => u.Companies)
                    .Include(u => u.AssignedProjects)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (existingUser == null)
                    return NotFound();

                existingUser.Name = userUpdateDto.Name;
                existingUser.LastName = userUpdateDto.LastName;
                existingUser.Email = userUpdateDto.Email;
                existingUser.CountryId = userUpdateDto.CountryId;
                existingUser.RoleId = userUpdateDto.RoleId;
                existingUser.PhoneNumber = userUpdateDto.PhoneNumber;
                existingUser.ContractStartDate = userUpdateDto.ContractStartDate;
                existingUser.ContractEndDate = userUpdateDto.ContractEndDate;

                var companies = await _context.Companies
                    .Where(c => userUpdateDto.CompanyIds.Contains(c.Id))
                    .ToListAsync();
                
                existingUser.Companies = companies;

                if (userUpdateDto.ProjectId.HasValue)
                {
                    var project = await _context.Projects.FindAsync(userUpdateDto.ProjectId);
                    existingUser.AssignedProjects.Clear();
                    if (project != null)
                        existingUser.AssignedProjects.Add(project);
                }

                await _context.SaveChangesAsync();

                return Ok(await GetUser(id));
            }
            catch (Exception ex)
            {
                _logger.LogError("Error updating user: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.Companies)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                    return NotFound();

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error deleting user: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }
        #endregion

        #region Specialized Endpoints
        [HttpGet("collaborateurs")]
        public async Task<ActionResult<IEnumerable<User>>> GetCollaborateurs()
        {
            try
            {
                return await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Role.Name == "Collaborateur")
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving collaborateurs: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("clients")]
        public async Task<ActionResult<IEnumerable<User>>> GetClients()
        {
            try
            {
                // First, let's check what user roles exist in the database
                var roles = await _context.Roles.Select(r => r.Name).ToListAsync();
                _logger.LogInformation("Available roles in database: {Roles}", string.Join(", ", roles));
                
                // Get users who are clients with more flexible role matching
                var clientRolePossibilities = new[] { "Client", "client", "Customer", "customer", "User", "user" };
                
                var clientUsers = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.Companies)
                    .Where(u => clientRolePossibilities.Contains(u.Role.Name))
                    .ToListAsync();
                
                _logger.LogInformation("Found {Count} client users", clientUsers.Count);
                
                if (clientUsers.Count == 0)
                {
                    // If no clients found, let's just get all non-admin/non-staff users
                    var regularUsers = await _context.Users
                        .Include(u => u.Role)
                        .Include(u => u.AssignedProjects)
                        .Include(u => u.Companies)
                        .Where(u => u.Role.Name != "Admin" && 
                                   u.Role.Name != "Chef Projet" && 
                                   u.Role.Name != "Collaborateur")
                        .ToListAsync();
                    
                    _logger.LogInformation("Found {Count} regular users instead", regularUsers.Count);
                    return Ok(regularUsers);
                }
                
                return Ok(clientUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving clients: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("chefs-projet")]
        public async Task<ActionResult<IEnumerable<User>>> GetChefsProjet()
        {
            try
            {
                return await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.AssignedProjects)
                    .Include(u => u.AssignedCollaborateurs)
                    .Where(u => u.Role.Name == "Chef Projet")
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving chefs projet: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] ChangePasswordDto model)
        {
            try
            {
                var userId = GetUserIdFromToken();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound();

                if (!VerifyPassword(user.PasswordHash, model.OldPassword))
                    return Unauthorized("Invalid current password");

                user.PasswordHash = HashPassword(model.NewPassword);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error updating password: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        } 

      [HttpGet("current")]
[Authorize]
public async Task<ActionResult<User>> GetCurrentUser()
{
    try
    {
        var userId = GetUserIdFromToken();
        if (userId <= 0)
            return Unauthorized("Invalid token");

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Projects)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user != null ? Ok(user) : NotFound("User not found");
    }
    catch (Exception ex)
    {
        _logger.LogError("Error retrieving current user: {Message}", ex.Message);
        return StatusCode(500, "Internal server error");
    }
}

        [HttpGet("chef-projet/{chefId}/collaborateurs")]
        public async Task<ActionResult<User[]>> GetCollaborateursByChefId(int chefId)
        {
            try
            {
                // Get collaborator IDs from the CollaborateurChef table
                var collaborateurIds = await _context.CollaborateurChefs
                    .Where(cc => cc.ChefProjetId == chefId)
                    .Select(cc => cc.CollaborateurId)
                    .ToListAsync();
                
                // Get the full collaborator details
                var collaborators = await _context.Users
                    .Where(u => collaborateurIds.Contains(u.Id))
                    .Include(u => u.Role)
                    .Include(u => u.Country)
                    .ToListAsync();

                return Ok(collaborators);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving collaborators for chef projet: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        // Update the AssignCollaborateurToChef endpoint
        [HttpPost("{chefId}/assign-collaborateur")]
        public async Task<IActionResult> AssignCollaborateurToChef(
            int chefId, 
            [FromBody] AssignCollaborateurToChefDto model)
        {
            try
            {
                if (model == null)
                {
                    _logger.LogError("Request body is null for chefId {ChefId}", chefId);
                    return BadRequest("Request body is required");
                }
                
                _logger.LogInformation("Assigning collaborateur {CollaborateurId} to chef {ChefId} - Request received", 
                    model.CollaborateurId, chefId);
                
                // Validate collaborateur ID
                if (model.CollaborateurId <= 0)
                {
                    _logger.LogError("Invalid collaborateur ID: {CollaborateurId}", model.CollaborateurId);
                    return BadRequest("Invalid collaborateur ID");
                }
                
                // Validate that chef exists and is a chef
                var chef = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == chefId);

                if (chef == null)
                {
                    _logger.LogWarning("Chef {ChefId} not found", chefId);
                    return NotFound("Chef Projet not found");
                }
                
                if (chef.Role?.Name != "Chef Projet")
                {
                    _logger.LogWarning("User {ChefId} with role {Role} is not a Chef Projet", 
                        chefId, chef.Role?.Name ?? "unknown");
                    return BadRequest($"User {chefId} is not a Chef Projet");
                }

                // Validate that collaborateur exists and is a collaborateur
                var collaborateur = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == model.CollaborateurId);

                if (collaborateur == null)
                {
                    _logger.LogWarning("Collaborateur {CollaborateurId} not found", 
                        model.CollaborateurId);
                    return NotFound("Collaborateur not found");
                }
                
                if (collaborateur.Role?.Name != "Collaborateur")
                {
                    _logger.LogWarning("User {CollaborateurId} with role {Role} is not a Collaborateur", 
                        model.CollaborateurId, collaborateur.Role?.Name ?? "unknown");
                    return BadRequest($"User {model.CollaborateurId} is not a Collaborateur");
                }

                // Check if the assignment already exists
                _logger.LogInformation("Checking if assignment already exists for collaborateur {CollaborateurId} and chef {ChefId}", 
                    model.CollaborateurId, chefId);
                    
                var existingAssignment = await _context.CollaborateurChefs
                    .FirstOrDefaultAsync(cc => 
                        cc.ChefProjetId == chefId && 
                        cc.CollaborateurId == model.CollaborateurId);
                
                if (existingAssignment != null)
                {
                    _logger.LogInformation("Assignment already exists for collaborateur {CollaborateurId} and chef {ChefId}", 
                        model.CollaborateurId, chefId);
                    return Ok(new { 
                        success = true, 
                        message = "Collaborateur is already assigned to this Chef Projet" 
                    });
                }

                // Create the assignment using the execution strategy instead of a manual transaction
                var executionStrategy = _context.Database.CreateExecutionStrategy();
                
                await executionStrategy.ExecuteAsync(async () => {
                    // Create the new assignment entry directly
                    var assignment = new CollaborateurChef
                    {
                        ChefProjetId = chefId,
                        CollaborateurId = model.CollaborateurId,
                        AssignedDate = DateTime.UtcNow
                    };
                    
                    // Add the entry without loading navigation properties
                    _context.CollaborateurChefs.Add(assignment);
                    
                    _logger.LogInformation("Saving CollaborateurChef assignment");
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Assignment saved with ID {Id}", assignment.Id);
                });
                
                return Ok(new {
                    success = true,
                    message = "Collaborateur assigned to Chef Projet successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning collaborateur {CollaborateurId} to chef {ChefId}: {Message}", 
                    model?.CollaborateurId, chefId, ex.Message);
                
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {InnerException}", ex.InnerException.Message);
                }
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Internal server error", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        [HttpPost("{collaborateurId}/remove-from-chef")]
        public async Task<IActionResult> RemoveCollaborateurFromChef(
            int collaborateurId,
            [FromBody] RemoveCollaborateurFromChefDto model)
        {
            try
            {
                _logger.LogInformation("Removing collaborateur {CollaborateurId} from chef {ChefId} - START", 
                    collaborateurId, model.ChefProjetId);
                
                var collaborateur = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == collaborateurId && u.Role.Name == "Collaborateur");

                if (collaborateur == null)
                {
                    _logger.LogWarning("Collaborateur {CollaborateurId} not found or is not a Collaborateur", 
                        collaborateurId);
                    return NotFound("Collaborateur not found");
                }

                // Find the specific assignment
                var assignment = await _context.CollaborateurChefs
                    .FirstOrDefaultAsync(cc => 
                        cc.ChefProjetId == model.ChefProjetId &&
                        cc.CollaborateurId == collaborateurId);
                
                if (assignment == null)
                {
                    _logger.LogWarning("No assignment found for collaborateur {CollaborateurId} and chef {ChefId}",
                        collaborateurId, model.ChefProjetId);
                    return NotFound(new { 
                        success = false, 
                        message = "Collaborateur is not assigned to this Chef Projet" 
                    });
                }

                _logger.LogInformation("Found assignment with ID {AssignmentId} to remove", assignment.Id);
                
                // Create the execution strategy instead of a manual transaction
                var executionStrategy = _context.Database.CreateExecutionStrategy();
                
                await executionStrategy.ExecuteAsync(async () => {
                    // Remove the assignment
                    _context.CollaborateurChefs.Remove(assignment);
                    await _context.SaveChangesAsync();
                });

                return Ok(new { 
                    success = true, 
                    message = "Collaborateur removed from Chef Projet successfully" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing collaborateur {CollaborateurId} from chef {ChefId}: {Message}", 
                    collaborateurId, model?.ChefProjetId, ex.Message);
                
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {InnerException}", ex.InnerException.Message);
                }
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Internal server error", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }
        #endregion

        #region Helpers
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }

        private bool VerifyPassword(string storedHash, string password)
        {
            return HashPassword(password) == storedHash;
        }

        private int GetUserIdFromToken()
        {
            return int.Parse(User.FindFirst("Id")?.Value ?? "-1");
        }

        private async Task<bool> UserExists(int id)
        {
            return await _context.Users.AnyAsync(e => e.Id == id);
        }

        [HttpGet("role-distribution")]
        public async Task<ActionResult> GetUserRoleDistribution()
        {
            try
            {
                var allRoles = await _context.Roles.ToListAsync();
                var roleStats = new List<object>();
                
                foreach (var role in allRoles)
                {
                    var count = await _context.Users
                        .Where(u => u.RoleId == role.Id)
                        .CountAsync();
                    
                    roleStats.Add(new { 
                        roleId = role.Id, 
                        roleName = role.Name, 
                        userCount = count 
                    });
                }
                
                return Ok(new { 
                    totalUsers = await _context.Users.CountAsync(),
                    roleDistribution = roleStats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting role distribution: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }
        #endregion
    }
}