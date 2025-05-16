using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SimSoftAPI.Controllers
{
    [Route("api/projects")]
    [ApiController]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(AppDbContext context, ILogger<ProjectController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            try
            {
                // Get all projects without any filtering or includes
                var allProjects = await _context.Projects.ToListAsync();
                _logger.LogInformation("Total projects in database: {Count}", allProjects.Count);
                
                foreach (var p in allProjects)
                {
                    _logger.LogInformation("Project ID: {Id}, Name: {Name}, ChefProjetId: {ChefId}, ClientId: {ClientId}",
                        p.Id, p.Name, p.ChefProjetId, p.ClientId);
                }

                // Include related data, but don't filter out projects with ChefProjetId = 0
                var projects = await _context.Projects
                    .Include(p => p.ChefProjet)
                    .Include(p => p.Collaborateurs)
                    .ToListAsync();
                
                _logger.LogInformation("Projects returned after includes: {Count}", projects.Count);
                
                // Ensure all projects are returned, regardless of navigation property loading issues
                if (projects.Count < allProjects.Count)
                {
                    _logger.LogWarning("Some projects were filtered out during Include loading. Using the full list.");
                    return Ok(allProjects);
                }
                
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving projects: {Message}", ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {InnerException}", ex.InnerException.Message);
                }
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Project>> AddProject(CreateProjectDto projectDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Model state is invalid for project creation");
                    foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                    {
                        _logger.LogWarning("ModelState error: {ErrorMessage}", error.ErrorMessage);
                    }
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Attempting to add project: {ProjectName}", projectDto.Name);

                var project = new Project
                {
                    Name = projectDto.Name,
                    Description = projectDto.Description,
                    Status = projectDto.Status ?? "En attente",
                    ChefProjetId = 0, // Default value since chef not assigned yet
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Project added successfully with ID: {ProjectId}", project.Id);
                return CreatedAtAction(nameof(GetProjects), new { id = project.Id }, project);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error creating project: {Message}", ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {InnerException}", ex.InnerException.Message);
                }
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{id}/assign")]
        public async Task<IActionResult> AssignProject(int id, [FromBody] AssignProjectDto model)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Collaborateurs)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null) return NotFound();

                var chef = await _context.Users.FindAsync(model.ChefProjetId);
                if (chef == null) return BadRequest("Chef Projet not found");
                project.ChefProjet = chef;

                var collaborators = await _context.Users
                    .Where(u => model.CollaborateurIds.Contains(u.Id))
                    .ToListAsync();

                project.Collaborateurs = collaborators;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error assigning project: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{chefId}/assign-project")]
        public async Task<IActionResult> AssignProjectToChef(int chefId, [FromBody] AssignProjectToChefDto model)
        {
            try
            {
                var chef = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == chefId);
                
                var project = await _context.Projects.FindAsync(model.ProjectId);

                if (chef == null)
                {
                    _logger.LogWarning("Chef {ChefId} not found", chefId);
                    return NotFound("Chef not found");
                }
                
                if (project == null)
                {
                    _logger.LogWarning("Project {ProjectId} not found", model.ProjectId);
                    return NotFound("Project not found");
                }
                
                // Validate that the user is a chef
                if (chef.Role?.Name != "Chef Projet")
                {
                    _logger.LogWarning("User {ChefId} with role {Role} is not a Chef Projet", 
                        chefId, chef.Role?.Name ?? "unknown");
                    return BadRequest($"User {chefId} is not a Chef Projet");
                }

                // Check if the assignment already exists
                var existingAssignment = await _context.ProjectChefs
                    .FirstOrDefaultAsync(pc => 
                        pc.ChefProjetId == chefId && 
                        pc.ProjectId == model.ProjectId);
                
                if (existingAssignment != null)
                {
                    _logger.LogInformation("Project {ProjectId} is already assigned to chef {ChefId}", 
                        model.ProjectId, chefId);
                    
                    return Ok(new { 
                        success = true, 
                        message = "Project is already assigned to this Chef Projet"
                    });
                }

                // If there's no existing ChefProjet for the project, set it as the primary chef
                if (project.ChefProjetId == 0)
                {
                    project.ChefProjetId = chefId;
                    project.ChefProjet = chef;
                    _logger.LogInformation("Setting chef {ChefId} as the primary chef for project {ProjectId}", 
                        chefId, model.ProjectId);
                }
                
                // Create the assignment in the join table
                var assignment = new ProjectChef
                {
                    ProjectId = model.ProjectId,
                    ChefProjetId = chefId,
                    AssignedDate = DateTime.UtcNow
                };
                
                _context.ProjectChefs.Add(assignment);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully assigned project {ProjectId} to chef {ChefId}", 
                    model.ProjectId, chefId);
                
                return Ok(new {
                    success = true,
                    message = "Project assigned to Chef Projet successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error assigning project to chef: {Message}", ex.Message);
                return StatusCode(500, new {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        [HttpGet("chef-projet/{chefId}")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjectsByChefId(int chefId)
        {
            try
            {
                _logger.LogInformation("[ProjectController] Fetching projects for chef projet with ID: {ChefId}", chefId);
                
                // First check if the chef exists and has correct role
                var chef = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == chefId);
                    
                if (chef == null)
                {
                    _logger.LogWarning("[ProjectController] Chef {ChefId} not found", chefId);
                    return NotFound(new { success = false, message = $"Chef with ID {chefId} not found" });
                }
                
                // For additional logging and debugging
                _logger.LogInformation("[ProjectController] Chef {ChefId} found. Name: {Name}, Role: {Role}, RoleId: {RoleId}", 
                    chefId, chef.Name + " " + chef.LastName, chef.Role?.Name, chef.RoleId);
                    
                // Get projects that have this chef as primary chef
                var primaryProjects = await _context.Projects
                    .Where(p => p.ChefProjetId == chefId)
                    .Include(p => p.ChefProjet)
                    .Include(p => p.Collaborateurs)
                    .ToListAsync();
                    
                _logger.LogInformation("[ProjectController] Found {Count} primary projects for chef {ChefId}", 
                    primaryProjects.Count, chefId);
                    
                // Get projects assigned via ProjectChef join table
                var secondaryProjectIds = await _context.ProjectChefs
                    .Where(pc => pc.ChefProjetId == chefId)
                    .Select(pc => pc.ProjectId)
                    .ToListAsync();
                    
                var secondaryProjects = await _context.Projects
                    .Where(p => secondaryProjectIds.Contains(p.Id) && p.ChefProjetId != chefId)
                    .Include(p => p.ChefProjet)
                    .Include(p => p.Collaborateurs)
                    .ToListAsync();
                    
                _logger.LogInformation("[ProjectController] Found {Count} secondary projects for chef {ChefId}", 
                    secondaryProjects.Count, chefId);
                    
                // Combine all projects and remove duplicates
                var allProjects = primaryProjects
                    .Concat(secondaryProjects)
                    .GroupBy(p => p.Id)
                    .Select(g => g.First())
                    .ToList();
                    
                _logger.LogInformation("[ProjectController] Returning total of {Count} unique projects for chef {ChefId}", 
                    allProjects.Count, chefId);
                    
                foreach (var project in allProjects)
                {
                    _logger.LogInformation("[ProjectController] Project: {Id} - {Name}, ChefId: {ChefId}", 
                        project.Id, project.Name, project.ChefProjetId);
                }
                    
                return Ok(allProjects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ProjectController] Error retrieving projects for chef {ChefId}: {Message}", 
                    chefId, ex.Message);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        [HttpGet("client/{clientId}/projects")]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjectsByClientId(int clientId)
        {
            try
            {
                // First check if the client exists
                var client = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == clientId);

                if (client == null)
                {
                    _logger.LogWarning("Client {ClientId} not found", clientId);
                    return NotFound($"Client with ID {clientId} not found");
                }

                // Check if the user has roleId = 2 (client role)
                if (client.RoleId != 2)
                {
                    _logger.LogWarning("User {UserId} with roleId {RoleId} is not a client", client.Id, client.RoleId);
                    return BadRequest($"User {clientId} is not a client (requires roleId = 2)");
                }

                // Get projects directly assigned via ClientId field
                var primaryProjects = await _context.Projects
                    .Where(p => p.ClientId == clientId)
                    .Include(p => p.ChefProjet)
                    .ToListAsync();

                // Get projects assigned via ProjectClient join table
                var secondaryProjectIds = await _context.ProjectClients
                    .Where(pc => pc.ClientId == clientId)
                    .Select(pc => pc.ProjectId)
                    .ToListAsync();

                var secondaryProjects = await _context.Projects
                    .Where(p => secondaryProjectIds.Contains(p.Id) && p.ClientId != clientId)
                    .Include(p => p.ChefProjet)
                    .ToListAsync();

                // Combine the results
                var allProjects = primaryProjects.Concat(secondaryProjects).ToList();

                _logger.LogInformation("Found {Count} projects for client {ClientId}", allProjects.Count, clientId);

                // Return empty array instead of 404 when no projects found
                return Ok(allProjects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects for client {ClientId}", clientId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("assign-project-to-client")]
        public async Task<IActionResult> AssignProjectToClientAlternate([FromBody] AssignProjectClientDto model)
        {
            try
            {
                _logger.LogInformation("Assigning project {ProjectId} to client {ClientId}", 
                    model.ProjectId, model.ClientId);
                
                var project = await _context.Projects.FindAsync(model.ProjectId);
                var client = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == model.ClientId);

                if (project == null)
                {
                    _logger.LogWarning("Project {ProjectId} not found", model.ProjectId);
                    return NotFound("Project not found");
                }
                    
                if (client == null)
                {
                    _logger.LogWarning("Client {ClientId} not found", model.ClientId);
                    return NotFound("Client not found");
                }

                // Check if the user has roleId = 2 (client role)
                if (client.RoleId != 2)
                {
                    _logger.LogWarning("User {UserId} with roleId {RoleId} is not a client", 
                        client.Id, client.RoleId);
                    return BadRequest($"User {model.ClientId} is not a client (requires roleId = 2)");
                }

                // Check if project is already assigned to this client via primary ClientId
                if (project.ClientId == model.ClientId)
                {
                    _logger.LogInformation("Project {ProjectId} is already assigned to client {ClientId} as primary client", 
                        model.ProjectId, model.ClientId);
                    
                    return Ok(new { 
                        success = true,
                        message = "Project is already assigned to this client",
                        project = new { 
                            id = project.Id,
                            name = project.Name,
                            clientId = project.ClientId
                        }
                    });
                }
                
                // Check if project is already assigned to this client via secondary assignment
                var existingAssignment = await _context.ProjectClients
                    .FirstOrDefaultAsync(pc => pc.ProjectId == model.ProjectId && pc.ClientId == model.ClientId);
                
                if (existingAssignment != null)
                {
                    _logger.LogInformation("Project {ProjectId} is already assigned to client {ClientId} as secondary client", 
                        model.ProjectId, model.ClientId);
                    
                    return Ok(new { 
                        success = true,
                        message = "Project is already assigned to this client",
                        project = new { 
                            id = project.Id,
                            name = project.Name,
                            clientId = project.ClientId
                        }
                    });
                }
                
                // If project has no primary client, assign this client as primary
                if (project.ClientId == null)
                {
                    project.ClientId = model.ClientId;
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Successfully assigned project {ProjectId} to client {ClientId} as primary client", 
                        model.ProjectId, model.ClientId);
                }
                else
                {
                    // Otherwise add as secondary client
                    var projectClient = new ProjectClient
                    {
                        ProjectId = model.ProjectId,
                        ClientId = model.ClientId
                    };
                    
                    _context.ProjectClients.Add(projectClient);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Successfully assigned project {ProjectId} to client {ClientId} as secondary client", 
                        model.ProjectId, model.ClientId);
                }
                
                return Ok(new { 
                    success = true,
                    project = new { 
                        id = project.Id,
                        name = project.Name,
                        clientId = project.ClientId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning project to client: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Collaborateurs)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null) return NotFound();

                // Update associated tickets to have null ProjectId instead of blocking deletion
                var associatedTickets = await _context.Tickets
                    .Where(t => t.ProjectId == id)
                    .ToListAsync();
                    
                if (associatedTickets.Any())
                {
                    _logger.LogInformation("Project {ProjectId} has {Count} associated tickets that will be updated", 
                        id, associatedTickets.Count);
                        
                    foreach (var ticket in associatedTickets)
                    {
                        ticket.ProjectId = 0; // Use 0 instead of null for non-nullable int
                        ticket.Project = null;
                        _logger.LogInformation("Ticket {TicketId} updated to have ProjectId = 0", ticket.Id);
                    }
                    
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("All associated tickets updated for project {ProjectId}", id);
                }

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Project {ProjectId} deleted successfully", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error deleting project: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Check if a project can be safely deleted (no associated tickets)
        /// </summary>
        /// <param name="id">Project ID to check</param>
        /// <returns>Result with canDelete flag and list of dependencies if any</returns>
        [HttpGet("{id}/can-delete")]
        public async Task<IActionResult> CanDeleteProject(int id)
        {
            try
            {
                _logger.LogInformation("Checking if project {ProjectId} can be deleted", id);
                
                var project = await _context.Projects.FindAsync(id);
                if (project == null) 
                {
                    _logger.LogWarning("Project {ProjectId} not found when checking if it can be deleted", id);
                    return NotFound(new { 
                        canDelete = false, 
                        message = "Project not found" 
                    });
                }

                // Check for associated tickets, but now we'll just inform about them rather than preventing deletion
                var associatedTickets = await _context.Tickets
                    .Where(t => t.ProjectId == id)
                    .Select(t => new { 
                        t.Id, 
                        t.Title,
                        t.Status 
                    })
                    .ToListAsync();

                // Always allow deletion, but inform about the consequences
                bool hasAssociatedTickets = associatedTickets.Any();
                
                // Log the result
                if (!hasAssociatedTickets)
                {
                    _logger.LogInformation("Project {ProjectId} ({ProjectName}) can be safely deleted with no associated tickets", 
                        id, project.Name);
                }
                else
                {
                    _logger.LogInformation("Project {ProjectId} ({ProjectName}) has {Count} associated tickets that will be updated", 
                        id, project.Name, associatedTickets.Count);
                }
                
                // Return result with detailed information
                return Ok(new { 
                    canDelete = true, // Always true with our new approach
                    message = !hasAssociatedTickets 
                        ? "Project can be safely deleted" 
                        : "Project will be deleted and associated tickets will be updated to have ProjectId = 0",
                    dependencies = associatedTickets.Select(t => $"Ticket #{t.Id}: {t.Title} ({t.Status})").ToList(),
                    dependencyCount = associatedTickets.Count,
                    willUpdateTickets = hasAssociatedTickets
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error checking if project can be deleted: {Message}", ex.Message);
                return StatusCode(500, new { 
                    canDelete = false, 
                    message = "Error checking project dependencies",
                    error = ex.Message
                });
            }
        }

        [HttpGet("test-assign-client")]
        public ActionResult TestAssignClientEndpoint()
        {
            return Ok(new { message = "Test endpoint is working!" });
        }

        [HttpDelete("{projectId}/remove-client/{clientId}")]
        public async Task<ActionResult<string>> RemoveClientFromProject(int projectId, int clientId)
        {
            try
            {
                _logger.LogInformation($"Removing client {clientId} from project with ID {projectId}");
                var project = await _context.Projects.FindAsync(projectId);
                
                if (project == null)
                {
                    _logger.LogWarning($"Project with ID {projectId} not found");
                    return NotFound($"Project with ID {projectId} not found");
                }
                
                _logger.LogInformation($"Found project: {project.Name}");
                
                // Check if it's the primary client
                if (project.ClientId == clientId)
                {
                    project.ClientId = null;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Primary client removed from project with ID {projectId}");
                    
                    // Check if there are any secondary clients that could be promoted to primary
                    var secondaryClient = await _context.ProjectClients
                        .Where(pc => pc.ProjectId == projectId)
                        .OrderBy(pc => pc.Id)
                        .FirstOrDefaultAsync();
                        
                    if (secondaryClient != null)
                    {
                        // Promote the first secondary client to primary
                        project.ClientId = secondaryClient.ClientId;
                        
                        // Remove this client from secondary assignments
                        _context.ProjectClients.Remove(secondaryClient);
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation($"Secondary client {secondaryClient.ClientId} promoted to primary for project {projectId}");
                    }
                }
                else
                {
                    // Check if it's a secondary client
                    var secondaryAssignment = await _context.ProjectClients
                        .FirstOrDefaultAsync(pc => pc.ProjectId == projectId && pc.ClientId == clientId);
                        
                    if (secondaryAssignment == null)
                    {
                        _logger.LogWarning($"Client {clientId} is not assigned to project {projectId}");
                        return NotFound($"Client {clientId} is not assigned to project {projectId}");
                    }
                    
                    _context.ProjectClients.Remove(secondaryAssignment);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Secondary client {clientId} removed from project {projectId}");
                }
                
                return Ok(new { message = $"Client removed from project successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing client from project with ID {projectId}: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        
        [HttpDelete("{projectId}/remove-client")]
        public async Task<ActionResult<string>> RemoveClientFromProject(int projectId)
        {
            try
            {
                _logger.LogInformation($"Removing client from project with ID {projectId}");
                var project = await _context.Projects.FindAsync(projectId);
                
                if (project == null)
                {
                    _logger.LogWarning($"Project with ID {projectId} not found");
                    return NotFound($"Project with ID {projectId} not found");
                }
                
                _logger.LogInformation($"Found project: {project.Name}");
                
                // Store the current client ID for the response
                var oldClientId = project.ClientId;
                
                project.ClientId = null;
                
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Client removed from project with ID {projectId}");
                
                return Ok(new { 
                    message = $"Client removed from project successfully", 
                    oldClientId = oldClientId,
                    project = new {
                        id = project.Id,
                        name = project.Name,
                        clientId = project.ClientId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing client from project with ID {projectId}: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{projectId}/remove-chef")]
        public async Task<IActionResult> RemoveChefFromProject(int projectId)
        {
            // Start a transaction to ensure database consistency
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                _logger.LogInformation("Removing chef from project {ProjectId} - START", projectId);
                
                // First verify the project exists and get the current count of projects
                int projectCountBefore = await _context.Projects.CountAsync();
                _logger.LogInformation("Current project count before removal: {Count}", projectCountBefore);
                
                var project = await _context.Projects
                    .Include(p => p.ChefProjet)
                    .FirstOrDefaultAsync(p => p.Id == projectId);
                
                if (project == null)
                {
                    _logger.LogWarning("Project {ProjectId} not found", projectId);
                    return NotFound("Project not found");
                }
                
                // Store the previous chef ID for logging
                var previousChefId = project.ChefProjetId;
                var chefName = project.ChefProjet?.Name ?? "Unknown";
                
                _logger.LogInformation("Found project {ProjectId} ({ProjectName}) with chef {ChefId} ({ChefName})", 
                    project.Id, project.Name, previousChefId, chefName);
                
                // Only update the ChefProjetId field to null, nothing else
                _logger.LogInformation("Setting ChefProjetId to 0 for project {ProjectId}", projectId);
                project.ChefProjetId = 0; // Or default value based on your data model
                
                await _context.SaveChangesAsync();
                
                // Verify the project still exists after the update
                var verifyProject = await _context.Projects.FindAsync(projectId);
                int projectCountAfter = await _context.Projects.CountAsync();
                
                _logger.LogInformation("Project count after removal: {Count}", projectCountAfter);
                
                if (verifyProject == null)
                {
                    _logger.LogError("Project {ProjectId} was deleted rather than just updated", projectId);
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Project was accidentally deleted during chef removal");
                }
                
                if (projectCountBefore != projectCountAfter)
                {
                    _logger.LogError("Project count changed from {Before} to {After} - indicating deletion", 
                        projectCountBefore, projectCountAfter);
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Project count changed unexpectedly during chef removal");
                }
                
                _logger.LogInformation("Project {ProjectId} ({ProjectName}) verified after update - new ChefProjetId: {ChefId}", 
                    verifyProject.Id, verifyProject.Name, verifyProject.ChefProjetId);
                
                await transaction.CommitAsync();
                
                _logger.LogInformation("Successfully removed chef {ChefId} from project {ProjectId} - COMPLETE", 
                    previousChefId, projectId);
                
                return Ok(new { 
                    success = true,
                    message = "Chef removed from project",
                    project = new { 
                        id = project.Id,
                        name = project.Name,
                        chefProjetId = project.ChefProjetId
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error removing chef from project {ProjectId}: {Message}", projectId, ex.Message);
                return StatusCode(500, new { success = false, message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{chefId}/remove-project")]
        public async Task<IActionResult> RemoveProjectFromChef(int chefId, [FromBody] RemoveProjectFromChefDto model)
        {
            try
            {
                var chef = await _context.Users.FindAsync(chefId);
                var project = await _context.Projects.FindAsync(model.ProjectId);

                if (chef == null)
                {
                    _logger.LogWarning("Chef {ChefId} not found", chefId);
                    return NotFound("Chef not found");
                }

                if (project == null)
                {
                    _logger.LogWarning("Project {ProjectId} not found", model.ProjectId);
                    return NotFound("Project not found");
                }

                // Find the assignment in the join table
                var assignment = await _context.ProjectChefs
                    .FirstOrDefaultAsync(pc =>
                        pc.ChefProjetId == chefId &&
                        pc.ProjectId == model.ProjectId);

                if (assignment == null)
                {
                    _logger.LogWarning("No assignment found for chef {ChefId} and project {ProjectId}",
                        chefId, model.ProjectId);
                    return NotFound("Project is not assigned to this Chef Projet");
                }

                // Remove the assignment from the join table
                _context.ProjectChefs.Remove(assignment);

                // If this chef was the primary chef for the project, update the project
                if (project.ChefProjetId == chefId)
                {
                    // Try to find another chef assigned to this project
                    var anotherChef = await _context.ProjectChefs
                        .Where(pc => pc.ProjectId == model.ProjectId && pc.ChefProjetId != chefId)
                        .Select(pc => pc.ChefProjetId)
                        .FirstOrDefaultAsync();

                    if (anotherChef != 0)
                    {
                        // Set another chef as the primary
                        project.ChefProjetId = anotherChef;
                        var newPrimaryChef = await _context.Users.FindAsync(anotherChef);
                        project.ChefProjet = newPrimaryChef;
                        _logger.LogInformation("Set chef {ChefId} as the new primary chef for project {ProjectId}",
                            anotherChef, model.ProjectId);
                    }
                    else
                    {
                        // No other chef assigned, clear the ChefProjet reference
                        project.ChefProjetId = 0;
                        project.ChefProjet = null;
                        _logger.LogInformation("Cleared primary chef for project {ProjectId}", model.ProjectId);
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully removed project {ProjectId} from chef {ChefId}",
                    model.ProjectId, chefId);

                return Ok(new
                {
                    success = true,
                    message = "Project removed from Chef Projet successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error removing project from chef: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        [HttpGet("chef/{chefId}/projects")]
        public async Task<IActionResult> GetChefProjects(int chefId)
        {
            try
            {
                var chef = await _context.Users.FindAsync(chefId);
                
                if (chef == null)
                {
                    _logger.LogWarning("Chef {ChefId} not found", chefId);
                    return NotFound("Chef not found");
                }

                // Check if user is a Chef Projet
                if (chef.Role?.Name != "Chef Projet")
                {
                    _logger.LogWarning("User {ChefId} is not a Chef Projet", chefId);
                    return BadRequest("User is not a Chef Projet");
                }

                // Get all projects associated with this chef using the join table
                var projects = await _context.ProjectChefs
                    .Where(pc => pc.ChefProjetId == chefId)
                    .Join(_context.Projects,
                        pc => pc.ProjectId,
                        p => p.Id,
                        (pc, p) => new
                        {
                            Id = p.Id,
                            Name = p.Name,
                            Description = p.Description,
                            Status = p.Status,
                            IsPrimaryChef = p.ChefProjetId == chefId,
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                            ClientId = p.ClientId,
                            ClientName = p.Client != null ? p.Client.Name + " " + p.Client.LastName : null
                        })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {0} projects for chef {1}", 
                    projects.Count, chefId);

                return Ok(new
                {
                    success = true,
                    data = projects
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error retrieving projects for chef: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }

        public class AssignProjectDto
        {
            public int ChefProjetId { get; set; }
            public List<int> CollaborateurIds { get; set; } = new List<int>();
        }

        public class AssignProjectToChefDto
        {
            public int ProjectId { get; set; }
        }

        public class AssignCollaborateurToChefDto
        {
            public int CollaborateurId { get; set; }
        }

        public class AssignProjectClientDto
        {
            public int ProjectId { get; set; }
            public int ClientId { get; set; }
        }

        public class CreateProjectDto
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? Status { get; set; }
        }

        public class RemoveProjectFromChefDto
        {
            public int ProjectId { get; set; }
        }
    }
}