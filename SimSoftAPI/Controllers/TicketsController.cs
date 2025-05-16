using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.DTOs;
using SimSoftAPI.Models;
using System.Security.Claims;
using SimSoftAPI.Services;
using MySqlConnector;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TicketsController> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly ITicketService _ticketService;
        private readonly INotificationService _notificationService;

        public TicketsController(
            AppDbContext context, 
            ILogger<TicketsController> logger, 
            IWebHostEnvironment environment, 
            ITicketService ticketService,
            INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
            _ticketService = ticketService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetAllTickets()
        {
            try
            {
                _logger.LogInformation("Starting GetAllTickets request");
                
                // Use explicit projection to avoid unknown field errors
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Select(t => new {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Status,
                        t.Priority,
                        t.Qualification,
                        t.ProjectId,
                        t.ProblemCategoryId,
                        t.AssignedToId,
                        t.CreatedDate,
                        t.UpdatedAt,
                        t.Report,
                        t.Attachment,
                        t.Commentaire,
                        t.CreatedById,
                        t.StartWorkTime,
                        t.FinishWorkTime,
                        t.WorkDuration,
                        t.TemporarilyStopped,
                        t.WorkFinished,
                        Project = t.Project != null ? new { 
                            t.Project.Id, 
                            t.Project.Name,
                            t.Project.Description,
                            t.Project.Status,
                            t.Project.ClientId,
                            t.Project.ChefProjetId
                        } : null,
                        ProblemCategory = t.ProblemCategory != null ? new { 
                            t.ProblemCategory.Id, 
                            t.ProblemCategory.Name 
                        } : null,
                        AssignedTo = t.AssignedTo != null ? new { 
                            t.AssignedTo.Id, 
                            t.AssignedTo.Name,
                            t.AssignedTo.Role
                        } : null
                    })
                    .ToListAsync();

                _logger.LogInformation($"Successfully retrieved {tickets?.Count ?? 0} tickets");
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tickets. Details: {Message}, StackTrace: {StackTrace}", 
                    ex.Message, ex.StackTrace);
                    
                // Return more detailed error information for debugging
                return StatusCode(500, new { 
                    message = "Internal server error while fetching tickets", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("assigned/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAssignedTickets(int userId)
        {
            try
            {
                _logger.LogInformation($"Fetching assigned tickets for user ID: {userId}");
                
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Where(t => t.AssignedToId == userId)
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Priority,
                        t.Qualification,
                        t.CreatedDate,
                        t.Status,
                        t.AssignedToId,
                        Project = new { t.Project.Id, t.Project.Name },
                        ProblemCategory = new { t.ProblemCategory.Id, t.ProblemCategory.Name }
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {tickets.Count} tickets for user {userId}");
                
                if (tickets.Count == 0)
                {
                    _logger.LogWarning($"No tickets found for user {userId}");
                }
                else
                {
                    foreach (var ticket in tickets)
                    {
                        _logger.LogInformation($"Ticket {ticket.Id}: {ticket.Title} - Status: {ticket.Status}");
                    }
                }

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in GetAssignedTickets for user {userId}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("with-reports")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetTicketsWithReports()
        {
            try
            {
                var query = _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Where(t => t.Report != null && t.Report != "NULL");

                var tickets = await query
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Priority,
                        t.Qualification,
                        t.Status,
                        t.CreatedDate,
                        t.UpdatedAt,
                        Report = t.Report,
                        Project = t.Project != null ? new { t.Project.Id, t.Project.Name } : null,
                        ProblemCategory = t.ProblemCategory != null ? new { t.ProblemCategory.Id, t.ProblemCategory.Name } : null,
                        AssignedTo = t.AssignedTo != null ? new { t.AssignedTo.Id, t.AssignedTo.Name } : null
                    })
                    .ToListAsync();

                _logger.LogInformation($"Successfully retrieved {tickets.Count} tickets with reports");
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tickets with reports. Stack trace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new 
                {
                    Message = "An error occurred while retrieving tickets",
                    Detailed = ex.Message,
                    StackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("test-connection")]
        public IActionResult TestConnection()
        {
            try
            {
                _context.Database.OpenConnection();
                _context.Database.CloseConnection();
                return Ok("Database connection successful");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Database connection failed: {ex.Message}");
            }
        }

        [HttpGet("mes-tickets")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetMesTickets()
        {
            try
            {
                _logger.LogInformation("Starting GetMesTickets request");
                
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    _logger.LogWarning("Failed to get user ID from claims in GetMesTickets");
                    return Unauthorized("User not authenticated or invalid user ID");
                }

                _logger.LogInformation($"Controller: Fetching tickets for user ID: {userId}");

                try
                {
                    // Use the service to get tickets
                    var tickets = await _ticketService.GetUserTicketsAsync(userId);
                    
                    _logger.LogInformation($"Controller: Successfully returned {tickets.Count} tickets for user {userId}");
                    return Ok(tickets);
                }
                catch (Exception serviceEx)
                {
                    _logger.LogError(serviceEx, "Error in ticket service: {Message}, StackTrace: {StackTrace}", 
                        serviceEx.Message, serviceEx.StackTrace);
                    
                    // Fallback method - direct query from controller in case service method is failing
                    _logger.LogWarning("Attempting fallback method to get tickets");
                    
                    try {
                        var projectIds = await _context.Projects
                            .Where(p => p.ClientId == userId)
                            .Select(p => p.Id)
                            .ToListAsync();
                        
                        _logger.LogInformation($"Fallback: Found {projectIds.Count} projects for user {userId}");
                        
                        // Use explicit projection to avoid unknown field errors
                        var tickets = await _context.Tickets
                            .Where(t => projectIds.Contains(t.ProjectId))
                            .Select(t => new {
                                t.Id,
                                t.Title,
                                t.Description,
                                t.Status,
                                t.Priority,
                                t.Qualification,
                                t.ProjectId,
                                t.ProblemCategoryId,
                                t.AssignedToId,
                                t.CreatedDate,
                                t.UpdatedAt,
                                t.Report,
                                t.Attachment,
                                t.Commentaire,
                                t.CreatedById,
                                t.StartWorkTime,
                                t.FinishWorkTime,
                                t.WorkDuration,
                                t.TemporarilyStopped,
                                t.WorkFinished,
                                Project = t.Project != null ? new { 
                                    t.Project.Id, 
                                    t.Project.Name,
                                    t.Project.Description,
                                    t.Project.Status,
                                    t.Project.ClientId,
                                    t.Project.ChefProjetId
                                } : null,
                                ProblemCategory = t.ProblemCategory != null ? new { 
                                    t.ProblemCategory.Id, 
                                    t.ProblemCategory.Name 
                                } : null,
                                AssignedTo = t.AssignedTo != null ? new { 
                                    t.AssignedTo.Id, 
                                    t.AssignedTo.Name,
                                    t.AssignedTo.Role
                                } : null
                            })
                            .OrderByDescending(t => t.CreatedDate)
                            .ToListAsync();
                        
                        _logger.LogInformation($"Fallback method found {tickets.Count} tickets for user {userId}");
                        return Ok(tickets);
                    }
                    catch (Exception fallbackEx) {
                        _logger.LogError(fallbackEx, "Fallback method also failed: {Message}, StackTrace: {StackTrace}", 
                            fallbackEx.Message, fallbackEx.StackTrace);
                        throw new Exception("Both primary and fallback methods failed", fallbackEx);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetMesTickets: {Message}, StackTrace: {StackTrace}, Inner: {Inner}", 
                    ex.Message, ex.StackTrace, ex.InnerException?.Message);
                
                // Return a more detailed error response for debugging
                return StatusCode(500, new { 
                    message = "Internal server error", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Upload attempted with null or empty file");
                return BadRequest(new { message = "No file selected or file is empty." });
            }

            try
            {
                if (!Directory.Exists(_environment.WebRootPath))
                {
                    Directory.CreateDirectory(_environment.WebRootPath);
                }

                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                if (file.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { message = "File size exceeds maximum limit of 10MB" });
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation($"File successfully uploaded: {uniqueFileName}");
                return Ok(new { path = $"/uploads/{uniqueFileName}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during file upload");
                return StatusCode(500, new { message = "Internal server error during file upload", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTicket(int id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.Attachment)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (ticket == null) return NotFound();

            if (!string.IsNullOrEmpty(ticket.Attachment))
            {
                var filePath = Path.Combine(_environment.WebRootPath, "uploads", 
                                           Path.GetFileName(ticket.Attachment));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            _context.Tickets.Remove(ticket);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetProjectTickets(int projectId)
        {
            try
            {
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Where(t => t.ProjectId == projectId)
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetProjectTickets");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTicket(int id, [FromBody] TicketDto ticketDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest("Invalid request body");
                }

                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (ticket == null)
                {
                    return NotFound();
                }

                // Update all properties
                ticket.Title = ticketDto.Title;
                ticket.Description = ticketDto.Description;
                ticket.Qualification = ticketDto.Qualification;
                ticket.Priority = ticketDto.Priority;
                ticket.Attachment = ticketDto.Attachment;
                ticket.Commentaire = ticketDto.Commentaire;
                ticket.ProjectId = ticketDto.ProjectId;
                ticket.ProblemCategoryId = ticketDto.ProblemCategoryId;
                
                // Update nullable and optional fields if provided
                if (ticketDto.AssignedToId.HasValue)
                {
                    ticket.AssignedToId = ticketDto.AssignedToId.Value;
                }
                
                if (!string.IsNullOrEmpty(ticketDto.Status))
                {
                    ticket.Status = ticketDto.Status;
                }
                
                if (!string.IsNullOrEmpty(ticketDto.Report))
                {
                    ticket.Report = ticketDto.Report;
                }
                 
                // Update workflow properties
                if (ticketDto.StartWorkTime != null)
                {
                    ticket.StartWorkTime = ticketDto.StartWorkTime;
                }
                
                if (ticketDto.FinishWorkTime != null)
                {
                    ticket.FinishWorkTime = ticketDto.FinishWorkTime;
                }
                
                if (ticketDto.WorkDuration.HasValue)
                {
                    ticket.WorkDuration = ticketDto.WorkDuration;
                }
                
                ticket.TemporarilyStopped = ticketDto.TemporarilyStopped;
                ticket.WorkFinished = ticketDto.WorkFinished;
                
                ticket.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Get the updated ticket with all includes
                var updatedTicket = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .FirstOrDefaultAsync(t => t.Id == id);

                // Check if status changed to Résolu/Résolu or changed from Résolu/Resolved to something else
                bool wasResolvedBefore = ticket.Status.Contains("ésolu") || ticket.Status.Contains("esolved");
                bool isResolvedNow = ticketDto.Status.Contains("ésolu") || ticketDto.Status.Contains("esolved");

                // If resolution status changed, notify the Chef Projet
                if (wasResolvedBefore != isResolvedNow && ticket.Project != null)
                {
                    try
                    {
                        // Get the project details to find its Chef Projet
                        var project = await _context.Projects
                            .FirstOrDefaultAsync(p => p.Id == ticket.ProjectId);
                            
                        if (project != null && project.ChefProjetId.HasValue)
                        {
                            // Determine if resolved or unresolved
                            string notificationType = isResolvedNow ? "TICKET_RESOLVED" : "TICKET_UNRESOLVED";
                            string messagePrefix = isResolvedNow ? 
                                "Le ticket a été résolu" : 
                                "Le ticket a été marqué comme non résolu";
                            
                            // Send notification to Chef Projet
                            _logger.LogInformation($"[TicketsController] Sending {notificationType} notification to Chef Projet ID {project.ChefProjetId}");
                            
                            await _notificationService.CreateNotificationAsync(
                                userId: project.ChefProjetId.Value,
                                message: $"{messagePrefix}: \"{ticket.Title}\" dans votre projet",
                                type: notificationType,
                                relatedTicketId: ticket.Id,
                                route: $"/chef-projet/tickets/{ticket.Id}"
                            );
                            
                            _logger.LogInformation($"[TicketsController] Successfully created {notificationType} notification for Chef Projet {project.ChefProjetId}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[TicketsController] Error creating resolution notification for Chef Projet");
                    }
                }

                return Ok(updatedTicket);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error updating ticket: {Message}", ex.Message);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("chef-projet/{chefProjetId}")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetProjectTicketsByChefProjetId(int chefProjetId)
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => p.ChefProjetId == chefProjetId)
                    .Select(p => p.Id)
                    .ToListAsync();

                if (!projects.Any())
                {
                    return Ok(new List<Ticket>());
                }

                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Where(t => projects.Contains(t.ProjectId))
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Priority,
                        t.Qualification,
                        t.Status,
                        t.CreatedDate,
                        t.UpdatedAt,
                        t.Report,
                        Project = new { t.Project.Id, t.Project.Name },
                        ProblemCategory = new { t.ProblemCategory.Id, t.ProblemCategory.Name },
                        AssignedTo = new { t.AssignedTo.Id, t.AssignedTo.Name }
                    })
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tickets for chef projet");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("refused")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetRefusedTickets()
        {
            try
            {
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Where(t => t.Status == "Refusé")
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching refused tickets");
                return StatusCode(500, "Internal server error while retrieving tickets");
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTicketStatus(int id, [FromBody] UpdateTicketStatusDto updateDto)
        {
            try
            {
                _logger.LogInformation($"[DEBUG-TICKET-STATUS] Updating ticket {id} status to {updateDto.Status}");
                
                // First, check if the ticket exists without using a complex query
                var ticketExists = await _context.Tickets
                    .AnyAsync(t => t.Id == id);
                    
                if (!ticketExists) 
                {
                    _logger.LogWarning($"[DEBUG-TICKET-STATUS] Ticket with ID {id} not found");
                    return NotFound($"Ticket with ID {id} not found");
                }

                // Get basic ticket info using SELECT with specified columns to avoid the ClientId field issue
                var ticketInfo = await _context.Tickets
                    .Where(t => t.Id == id)
                    .Select(t => new { t.Id, t.Title, t.Status, t.CreatedById, t.ProjectId })
                    .FirstOrDefaultAsync();
                    
                if (ticketInfo == null)
                {
                    _logger.LogWarning($"[DEBUG-TICKET-STATUS] Could not get basic ticket info for ID {id}");
                    return NotFound($"Could not get basic ticket info for ID {id}");
                }
                    
                // Log detailed ticket information for debugging
                _logger.LogInformation($"[DEBUG-TICKET-STATUS] Found ticket {id}: Current status={ticketInfo.Status}, Title={ticketInfo.Title}, CreatedById={ticketInfo.CreatedById}");
                
                // Store the original status for notification
                var previousStatus = ticketInfo.Status;
                
                // Use direct SQL UPDATE instead of EF to avoid ClientId issue
                string updateSql = @"
                    UPDATE Tickets 
                    SET Status = @status";
                    
                // Add report update if provided
                if (!string.IsNullOrEmpty(updateDto.Report))
                {
                    updateSql += ", rapport = @report";
                }
                
                updateSql += " WHERE Id = @id";
                
                var parameters = new List<MySqlConnector.MySqlParameter>
                {
                    new MySqlConnector.MySqlParameter("@status", updateDto.Status),
                    new MySqlConnector.MySqlParameter("@id", id)
                };
                
                if (!string.IsNullOrEmpty(updateDto.Report))
                {
                    parameters.Add(new MySqlConnector.MySqlParameter("@report", updateDto.Report));
                    _logger.LogInformation($"[DEBUG-TICKET-STATUS] Will update report for ticket {id}");
                    
                    // Create notification for admin users about a new report
                    await _notificationService.CreateNotificationForAdminsAsync(
                        $"Un rapport a été créé pour le ticket \"{ticketInfo?.Title ?? "Unknown"}\"",
                        $"/admin/rapports",
                        "REPORT_CREATED",
                        id);
                    
                    _logger.LogInformation($"[DEBUG-TICKET-STATUS] Created report notification for admin users");
                    
                    // Get the project ID to find the Chef Projet
                    var projectId = ticketInfo.ProjectId;
                    if (projectId != 0)
                    {
                        try
                        {
                            // Get Chef Projet ID for this project
                            var chefProjet = await _context.Projects
                                .Where(p => p.Id == projectId)
                                .Select(p => new { p.ChefProjetId })
                                .FirstOrDefaultAsync();
                                
                            if (chefProjet != null && chefProjet.ChefProjetId.HasValue)
                            {
                                // Get the current user who created the report
                                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                                string reporterName = "Un collaborateur";
                                
                                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                                {
                                    var user = await _context.Users
                                        .Where(u => u.Id == userId)
                                        .Select(u => new { u.Name })
                                        .FirstOrDefaultAsync();
                                    
                                    if (user != null)
                                    {
                                        reporterName = user.Name;
                                    }
                                }
                                
                                // Create notification for Chef Projet
                                await _notificationService.CreateNotificationAsync(
                                    userId: chefProjet.ChefProjetId.Value,
                                    message: $"{reporterName} a créé un rapport pour le ticket \"{ticketInfo?.Title ?? "Unknown"}\" de votre projet",
                                    type: "REPORT_CREATED",
                                    relatedTicketId: id,
                                    route: $"/chef-projet/rapports/{id}");
                                
                                _logger.LogInformation($"[DEBUG-TICKET-STATUS] Created report notification for Chef Projet (ID: {chefProjet.ChefProjetId})");
                            }
                            else
                            {
                                _logger.LogWarning($"[DEBUG-TICKET-STATUS] No Chef Projet found for project {projectId}, skipping notification");
                            }
                        }
                        catch (Exception chefProjetEx)
                        {
                            // Don't let Chef Projet notification failures block the update
                            _logger.LogError(chefProjetEx, $"[DEBUG-TICKET-STATUS] Failed to create notification for Chef Projet about report for ticket {id}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"[DEBUG-TICKET-STATUS] No ProjectId found for ticket {id}, skipping Chef Projet notification");
                    }
                }
                    
                try
                {
                    // Execute SQL update
                    _logger.LogInformation($"[DEBUG-TICKET-STATUS] About to execute SQL update for ticket {id}");
                    int rowsAffected = await _context.Database.ExecuteSqlRawAsync(updateSql, parameters.ToArray());
                    _logger.LogInformation($"[DEBUG-TICKET-STATUS] Successfully updated {rowsAffected} row(s) for ticket {id}");
                    
                    if (rowsAffected == 0)
                    {
                        _logger.LogWarning($"[DEBUG-TICKET-STATUS] No rows were updated for ticket {id}");
                        return NotFound($"Ticket with ID {id} not found or was not updated");
                    }
                }
                catch (Exception sqlEx)
                {
                    _logger.LogError(sqlEx, $"[DEBUG-TICKET-STATUS] SQL error updating ticket {id}");
                    return StatusCode(500, $"Database error while updating the ticket status: {sqlEx.Message}");
                }
                
                // Create notification for the status change
                try
                {
                    if (ticketInfo?.CreatedById.HasValue == true)
                    {
                        _logger.LogInformation($"[DEBUG-TICKET-STATUS] Creating notification for user {ticketInfo.CreatedById.Value} about status change from '{previousStatus}' to '{updateDto.Status}'");
                        
                        var notificationMessage = $"Le statut de votre ticket '{ticketInfo.Title ?? "Unknown"}' a été mis à jour de '{previousStatus}' à '{updateDto.Status}'";
                        
                        // Get user info to ensure notification route is correct for their role
                        var creator = await _context.Users
                            .Where(u => u.Id == ticketInfo.CreatedById.Value)
                            .Select(u => new { u.Id, u.Role })
                            .FirstOrDefaultAsync();
                        
                        string route = $"/user/mes-tickets/{id}";
                        if (creator != null)
                        {
                            // Set route based on user role
                            if (creator.Role != null && (creator.Role.Name == "CLIENT" || creator.Role.Name == "USER"))
                            {
                                route = $"/user/mes-tickets/{id}";
                            }
                            else if (creator.Role != null && creator.Role.Name == "COLLABORATEUR")
                            {
                                route = $"/collaborateur/tickets/{id}";
                            }
                            else if (creator.Role != null && creator.Role.Name == "CHEF_PROJET")
                            {
                                route = $"/chef-projet/tickets/{id}";
                            }
                        }
                        
                        await _notificationService.CreateNotificationAsync(
                            userId: ticketInfo.CreatedById.Value,
                            message: notificationMessage,
                            type: "TICKET_STATUS_CHANGED",
                            relatedTicketId: id,
                            route: route);
                        
                        _logger.LogInformation($"[DEBUG-TICKET-STATUS] Successfully created status change notification for user {ticketInfo.CreatedById.Value} with route {route}");
                        
                        // Add special handling for resolution status changes
                        if (updateDto.Status == "Résolu" || updateDto.Status == "Non résolu")
                        {
                            bool isResolved = updateDto.Status == "Résolu";
                            
                            // Get the current user who made the change
                            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                            string userInfo = "Unknown user";
                            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                            {
                                var user = await _context.Users
                                    .Where(u => u.Id == userId)
                                    .Select(u => new { u.Id, u.Name, u.Role })
                                    .FirstOrDefaultAsync();
                                
                                if (user != null)
                                {
                                    userInfo = $"User {user.Id} ({user.Name}, {user.Role})";
                                }
                            }
                            
                            _logger.LogInformation($"[DEBUG-TICKET-STATUS] Ticket {id} has been marked as {(isResolved ? "resolved" : "unresolved")} by {userInfo}");
                            
                            // Create a specific resolution notification
                            await _notificationService.CreateTicketResolvedNotificationAsync(
                                ticketId: id,
                                isResolved: isResolved,
                                recipientId: ticketInfo.CreatedById.Value
                            );
                            
                            _logger.LogInformation($"[DEBUG-TICKET-STATUS] Created resolution notification (isResolved={isResolved}) for user {ticketInfo.CreatedById.Value}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"[DEBUG-TICKET-STATUS] No CreatedById found for ticket {id}, skipping notification");
                    }
                }
                catch (Exception notifEx)
                {
                    // Don't let notification failures block the status update
                    _logger.LogError(notifEx, $"[DEBUG-TICKET-STATUS] Failed to create notification for ticket {id} status change");
                }

                // Get updated ticket info with only the safe fields
                var updatedTicket = await _context.Tickets
                    .Where(t => t.Id == id)
                    .Select(t => new {
                        t.Id,
                        t.Title,
                        t.Status,
                        t.CreatedDate,
                        t.UpdatedAt,
                        CreatedById = t.CreatedById
                    })
                    .FirstOrDefaultAsync();

                _logger.LogInformation($"[DEBUG-TICKET-STATUS] Successfully completed update of ticket {id} status to {updateDto.Status}");
                
                // Null-check the updatedTicket before using its properties
                if (updatedTicket != null)
                {
                    string titleSafe = updatedTicket.Title ?? "Unknown";
                    string statusSafe = updatedTicket.Status ?? "Unknown";
                    
                    // Notify admin users about the status change
                    await _notificationService.CreateNotificationForAdminsAsync(
                        $"Le ticket \"{titleSafe}\" est passé de \"{previousStatus}\" à \"{statusSafe}\"",
                        $"/admin/tickets/{updatedTicket.Id}",
                        "TICKET_STATUS_CHANGED",
                        updatedTicket.Id);
                    
                    // If status is now resolved or unresolved, create specific notification
                    if (statusSafe.ToLower().Contains("résolu") || statusSafe.ToLower().Contains("resolu"))
                    {
                        await _notificationService.CreateNotificationForAdminsAsync(
                            $"Le ticket \"{titleSafe}\" a été résolu",
                            $"/admin/tickets/{updatedTicket.Id}",
                            "TICKET_RESOLVED",
                            updatedTicket.Id);
                    }
                    else if (previousStatus.ToLower().Contains("résolu") || previousStatus.ToLower().Contains("resolu"))
                    {
                        await _notificationService.CreateNotificationForAdminsAsync(
                            $"Le ticket \"{titleSafe}\" a été marqué comme non résolu",
                            $"/admin/tickets/{updatedTicket.Id}",
                            "TICKET_UNRESOLVED",
                            updatedTicket.Id);
                    }
                }

                // Notify admin users about the report if one was provided
                if (!string.IsNullOrEmpty(updateDto.Report))
                {
                    try
                    {
                        // Get the current user who created the report
                        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                        string reporterName = "Un collaborateur";
                        
                        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                        {
                            var user = await _context.Users
                                .Where(u => u.Id == userId)
                                .Select(u => new { u.Name })
                                .FirstOrDefaultAsync();
                            
                            if (user != null)
                            {
                                reporterName = user.Name;
                            }
                        }
                        
                        // Create a notification for all admins about the report
                        await _notificationService.CreateNotificationForAdminsAsync(
                            message: $"{reporterName} a ajouté un rapport au ticket \"{ticketInfo.Title}\"",
                            route: $"/admin/tickets/{id}",
                            type: "REPORT_ADDED",
                            relatedId: id
                        );
                        
                        _logger.LogInformation($"[UpdateTicketStatus] Created report notification for admins");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[UpdateTicketStatus] Error creating admin report notification");
                        // Continue execution - we don't want to fail the status update just because the notification failed
                    }
                }

                return Ok(updatedTicket);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[DEBUG-TICKET-STATUS] Unhandled exception updating ticket {id} status");
                return StatusCode(500, $"An error occurred while updating the ticket status: {ex.Message}");
            }
        }

        [HttpPatch("{id}/comment")]
        public async Task<IActionResult> UpdateTicketComment(int id, [FromBody] UpdateTicketCommentDto updateDto)
        {
            try
            {
                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (ticket == null) return NotFound($"Ticket with ID {id} not found");

                // Get the current user's ID and name for the notification
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    _logger.LogWarning("Failed to get current user ID from claims");
                    return Unauthorized("User not authenticated");
                }

                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    _logger.LogWarning($"Current user with ID {currentUserId} not found");
                    return Unauthorized("User not found");
                }

                // Use the commenter name from request if provided, otherwise get from current user
                var commenterName = updateDto.CommenterName ?? currentUser.Name ?? "Un utilisateur";
                _logger.LogInformation($"[Comment] Commenter name: {commenterName}");

                // Update the comment if provided and not the special NOTIFICATION_ONLY value
                if (!string.IsNullOrEmpty(updateDto.Commentaire) && updateDto.Commentaire != "NOTIFICATION_ONLY")
                {
                    ticket.Commentaire = updateDto.Commentaire;
                    ticket.UpdatedAt = DateTime.UtcNow;
                }
                    
                // PRIORITY: Always notify the ticket creator when someone else comments
                int? notifyUserId = null;
                bool isTicketCreator = currentUserId == ticket.CreatedById;
                
                // Log critical info about the users involved
                _logger.LogInformation($"[Comment] Current user ID: {currentUserId}, Ticket creator ID: {ticket.CreatedById}, Is creator: {isTicketCreator}");

                // If the commenter is NOT the ticket creator, notify the creator
                if (!isTicketCreator && ticket.CreatedById.HasValue)
                {
                    notifyUserId = ticket.CreatedById;
                    _logger.LogInformation($"[Comment] Will notify ticket creator {notifyUserId} about new comment");
                    
                    // Get creator role to determine correct notification route
                    var creator = await _context.Users
                        .Where(u => u.Id == ticket.CreatedById.Value)
                        .Select(u => new { u.Role })
                        .FirstOrDefaultAsync();
                        
                    string route = $"/user/mes-tickets/{id}";
                    if (creator != null)
                    {
                        if (creator.Role != null && creator.Role.Name == "COLLABORATEUR")
                        {
                            route = $"/collaborateur/tickets/{id}";
                        } 
                        else if (creator.Role != null && creator.Role.Name == "CHEF_PROJET")
                        {
                            route = $"/chef-projet/tickets/{id}";
                        }
                    }
                        
                    // Create notification for the ticket creator
                    await _notificationService.CreateCommentNotificationAsync(
                        ticketId: id,
                        ticketTitle: ticket.Title,
                        commenterName: commenterName,
                        recipientId: ticket.CreatedById.Value
                    );
                    
                    _logger.LogInformation($"[Comment] Created comment notification for creator {ticket.CreatedById.Value} with route {route}");
                }
                // If explicit notification recipient is provided 
                else if (updateDto.NotifyUserId.HasValue && updateDto.NotifyUserId > 0)
                {
                    notifyUserId = updateDto.NotifyUserId;
                    _logger.LogInformation($"[Comment] Using explicit recipient ID {notifyUserId} from request");
                    
                    // Create notification for the explicit recipient
                    await _notificationService.CreateCommentNotificationAsync(
                        ticketId: id,
                        ticketTitle: ticket.Title,
                        commenterName: commenterName,
                        recipientId: notifyUserId.Value
                    );
                }
                // If the commenter is the creator, notify the assigned user (if different)
                else if (isTicketCreator && ticket.AssignedToId > 0 && ticket.AssignedToId != currentUserId)
                {
                    notifyUserId = ticket.AssignedToId;
                    _logger.LogInformation($"[Comment] Notifying assigned user {notifyUserId} about creator comment");
                    
                    // Create notification for the assigned user
                    await _notificationService.CreateCommentNotificationAsync(
                        ticketId: id,
                        ticketTitle: ticket.Title,
                        commenterName: commenterName,
                        recipientId: notifyUserId.Value
                    );
                }
                else
                {
                    _logger.LogInformation("[Comment] No notification recipient identified");
                }

                await _context.SaveChangesAsync();

                // After successfully creating the comment notification for the ticket owner
                // Now notify the Chef Projet if they aren't the commenter
                if (ticket.Project != null)
                {
                    try
                    {
                        // Get the Chef Projet for this project
                        var project = await _context.Projects
                            .FirstOrDefaultAsync(p => p.Id == ticket.ProjectId);
                            
                        if (project != null && project.ChefProjetId.HasValue && project.ChefProjetId != currentUserId)
                        {
                            _logger.LogInformation($"[Comment] Also notifying Chef Projet {project.ChefProjetId} about this comment");
                            
                            // Create notification for the Chef Projet
                            await _notificationService.CreateNotificationAsync(
                                userId: project.ChefProjetId.Value,
                                message: $"{commenterName} a ajouté un commentaire au ticket \"{ticket.Title}\" de votre projet",
                                type: "COMMENT_ADDED",
                                relatedTicketId: id,
                                route: $"/chef-projet/tickets/{id}"
                            );
                            
                            _logger.LogInformation($"[Comment] Successfully created comment notification for Chef Projet {project.ChefProjetId.Value}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Comment] Error creating Chef Projet comment notification");
                        // Continue execution - we don't want to fail the comment update just because the notification failed
                    }
                }

                // Also notify all admins
                try
                {
                    // Create a notification specifically for all admins
                    await _notificationService.CreateNotificationForAdminsAsync(
                        message: $"{commenterName} a ajouté un commentaire au ticket \"{ticket.Title}\"",
                        route: $"/admin/tickets/{id}",
                        type: "COMMENT_ADDED",
                        relatedId: id
                    );
                    
                    _logger.LogInformation($"[Comment] Successfully created comment notification for admins");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Comment] Error creating admin comment notification");
                    // Continue execution - we don't want to fail the comment update just because the notification failed
                }

                return Ok(new
                {
                    ticket.Id,
                    ticket.Title,
                    ticket.Commentaire,
                    NotifyUserId = notifyUserId,
                    CommenterName = commenterName,
                    CreatedById = ticket.CreatedById  // Include the creator ID in the response for debugging
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ticket comment");
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        [HttpGet("resolved")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetResolvedTickets()
        {
            return await _context.Tickets
                .Where(t => t.Status == "Résolu")
                .ToListAsync();
        }

        [HttpGet("history/{userId}")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetTicketHistory(int userId)
        {
            try
            {
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .Where(t => t.AssignedToId == userId && 
                               (t.Status == "Résolu" || t.Status == "Non résolu"))
                    .OrderByDescending(t => t.UpdatedAt ?? t.CreatedDate)
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ticket history for user {UserId}", userId);
                return StatusCode(500, "Internal server error while retrieving ticket history");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Ticket>> CreateTicket([FromBody] TicketDto ticketDto)
        {
            _logger.LogInformation("CreateTicket endpoint called with CategoryId: {CategoryId}", ticketDto.ProblemCategoryId);

            try
            {
                // Get the current user's ID from the claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int? createdById = null;
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    createdById = userId;
                    _logger.LogInformation($"Creating ticket for user ID: {userId}");
                }
                else
                {
                    _logger.LogWarning("No user ID found in claims. Ticket will be created without creator information.");
                }

                // Verify the category exists using direct query
                var categoryExists = await _context.ProblemCategories
                    .Where(c => c.Id == ticketDto.ProblemCategoryId)
                    .Select(c => c.Id)
                    .AnyAsync();
                    
                if (!categoryExists)
                {
                    return BadRequest($"Problem category with ID {ticketDto.ProblemCategoryId} does not exist");
                }

                // Use direct SQL insertion to avoid the ClientId field problem
                string createdDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
                string sql = @"
                    INSERT INTO Tickets (
                        Title, Description, Status, Priority, Qualification, 
                        CreatedDate, ProjectId, ProblemCategoryId, AssignedToId,
                        Attachment, Commentaire, CreatedById, updated_at
                    ) VALUES (
                        @Title, @Description, 'Open', @Priority, @Qualification,
                        @CreatedDate, @ProjectId, @ProblemCategoryId, @AssignedToId,
                        @Attachment, @Commentaire, @CreatedById, @UpdatedAt
                    );
                    SELECT LAST_INSERT_ID();";

                // Create parameters
                var parameters = new List<MySqlConnector.MySqlParameter>
                {
                    new MySqlConnector.MySqlParameter("@Title", ticketDto.Title),
                    new MySqlConnector.MySqlParameter("@Description", ticketDto.Description),
                    new MySqlConnector.MySqlParameter("@Priority", ticketDto.Priority),
                    new MySqlConnector.MySqlParameter("@Qualification", ticketDto.Qualification),
                    new MySqlConnector.MySqlParameter("@CreatedDate", createdDate),
                    new MySqlConnector.MySqlParameter("@ProjectId", ticketDto.ProjectId),
                    new MySqlConnector.MySqlParameter("@ProblemCategoryId", ticketDto.ProblemCategoryId),
                    new MySqlConnector.MySqlParameter("@AssignedToId", ticketDto.AssignedToId ?? 1),
                    new MySqlConnector.MySqlParameter("@Attachment", ticketDto.Attachment ?? ""),
                    new MySqlConnector.MySqlParameter("@Commentaire", ticketDto.Commentaire ?? ""),
                    new MySqlConnector.MySqlParameter("@CreatedById", createdById.HasValue ? createdById.Value : DBNull.Value),
                    new MySqlConnector.MySqlParameter("@UpdatedAt", createdDate)
                };

                // Execute the SQL command to insert and get the ID
                var connection = _context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync();
                }

                int ticketId;
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = sql;
                    foreach (var parameter in parameters)
                    {
                        command.Parameters.Add(parameter);
                    }
                    
                    ticketId = Convert.ToInt32(await command.ExecuteScalarAsync());
                }

                // Retrieve the created ticket info without using Include
                var result = await _context.Tickets
                    .Where(t => t.Id == ticketId)
                    .Select(t => new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Status,
                        t.Priority,
                        t.Qualification,
                        t.ProjectId,
                        t.ProblemCategoryId,
                        t.AssignedToId,
                        t.CreatedDate,
                        t.UpdatedAt,
                        t.Attachment,
                        t.Commentaire,
                        t.CreatedById,
                        ProjectName = t.Project != null ? t.Project.Name : null,
                        CategoryName = t.ProblemCategory != null ? t.ProblemCategory.Name : null,
                        AssigneeName = t.AssignedTo != null ? t.AssignedTo.Name : null
                    })
                    .FirstOrDefaultAsync();

                if (result == null)
                {
                    return StatusCode(500, "Ticket was created but could not be retrieved");
                }

                // After the ticket is created successfully, notify the Chef Projet
                if (ticketId > 0)
                {
                    try
                    {
                        // Get the project details to find its Chef Projet
                        var project = await _context.Projects
                            .FirstOrDefaultAsync(p => p.Id == ticketDto.ProjectId);
                            
                        if (project != null && project.ChefProjetId.HasValue)
                        {
                            // Send notification to Chef Projet
                            _logger.LogInformation($"[TicketsController] Sending NEW_TICKET notification to Chef Projet ID {project.ChefProjetId}");
                            
                            await _notificationService.CreateNotificationAsync(
                                userId: project.ChefProjetId.Value,
                                message: $"Un nouveau ticket \"{ticketDto?.Title ?? "Unknown"}\" a été créé pour votre projet",
                                type: "NEW_TICKET",
                                relatedTicketId: ticketId,
                                route: $"/chef-projet/tickets/{ticketId}"
                            );
                            
                            _logger.LogInformation($"[TicketsController] Successfully created NEW_TICKET notification for Chef Projet {project.ChefProjetId}");
                        }
                        else
                        {
                            _logger.LogWarning($"[TicketsController] Could not notify Chef Projet - project {ticketDto.ProjectId} not found or has no Chef Projet assigned");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[TicketsController] Error creating notification for Chef Projet");
                    }
                }

                // After the ticket is created successfully, notify admins
                try
                {
                    // Get admin users - typically this would be a separate service or repository call
                    var adminUsers = await _context.Users
                        .Where(u => u.Role != null && u.Role.Name == "ADMIN")
                        .ToListAsync();
                        
                    if (adminUsers.Any())
                    {
                        string message = $"Nouveau ticket créé: \"{ticketDto?.Title ?? "Unknown"}\"";
                        string route = $"/admin/tickets/{ticketId}";
                        
                        // Create notifications for each admin
                        foreach (var admin in adminUsers)
                        {
                            await _notificationService.CreateNotificationAsync(
                                userId: admin.Id,
                                message: message,
                                type: "NEW_TICKET",
                                relatedTicketId: ticketId,
                                route: route
                            );
                            
                            _logger.LogInformation($"[TicketsController] Created NEW_TICKET notification for admin {admin.Id}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[TicketsController] Error creating admin notifications for new ticket");
                    // Continue execution - don't let notification errors block the main flow
                }

                // Notify admin users about the new ticket
                string titleSafe = ticketDto?.Title ?? "Unknown";
                await _notificationService.CreateNotificationForAdminsAsync(
                    $"Nouveau ticket créé: \"{titleSafe}\"",
                    $"/admin/tickets/{ticketId}",
                    "NEW_TICKET",
                    ticketId);

                return CreatedAtAction(nameof(GetTicket), new { id = ticketId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ticket: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    message = "Internal server error while creating ticket",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Ticket>> GetTicket(int id)
        {
            try
            {
                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (ticket == null)
                {
                    return NotFound($"Ticket with ID {id} not found");
                }

                return Ok(ticket);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ticket");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPatch("{id}/workflow")]
        public async Task<IActionResult> UpdateTicketWorkflow(int id, [FromBody] UpdateTicketWorkflowDto updateDto)
        {
            try
            {
                var ticket = await _context.Tickets.FindAsync(id);
                if (ticket == null) return NotFound($"Ticket with ID {id} not found");

                bool statusChanged = false;
                bool workFinishedChanged = false;
                bool previousWorkFinished = ticket.WorkFinished;
                string previousStatus = ticket.Status; // Store previous status for notification
                
                // Update only the properties that are provided in the DTO
                if (updateDto.TemporarilyStopped.HasValue)
                {
                    ticket.TemporarilyStopped = updateDto.TemporarilyStopped.Value;
                    
                    // If stopping work, calculate and save the duration
                    if (updateDto.TemporarilyStopped.Value && !string.IsNullOrEmpty(ticket.StartWorkTime))
                    {
                        var startTime = DateTime.Parse(ticket.StartWorkTime);
                        var endTime = DateTime.UtcNow;
                        var duration = (int)(endTime - startTime).TotalSeconds;
                        
                        // Add to existing duration if any
                        ticket.WorkDuration = (ticket.WorkDuration ?? 0) + duration;
                        ticket.FinishWorkTime = endTime.ToString("o");
                    }
                }

                if (updateDto.WorkFinished.HasValue)
                {
                    workFinishedChanged = ticket.WorkFinished != updateDto.WorkFinished.Value;
                    ticket.WorkFinished = updateDto.WorkFinished.Value;
                    
                    // When work is finished, also update status
                    if (updateDto.WorkFinished.Value)
                    {
                        statusChanged = ticket.Status != "Résolu";
                        ticket.Status = "Résolu";
                        
                        // Calculate final duration if not already set
                        if (!string.IsNullOrEmpty(ticket.StartWorkTime))
                        {
                            var startTime = DateTime.Parse(ticket.StartWorkTime);
                            var endTime = DateTime.UtcNow;
                            var duration = (int)(endTime - startTime).TotalSeconds;
                            
                            // Add to existing duration if any
                            ticket.WorkDuration = (ticket.WorkDuration ?? 0) + duration;
                            ticket.FinishWorkTime = endTime.ToString("o");
                        }
                    }
                    else if (previousWorkFinished) // Only change status if it was previously resolved
                    {
                        statusChanged = ticket.Status != "Non résolu";
                        ticket.Status = "Non résolu";
                    }
                }

                if (updateDto.StartWorkTime != null)
                {
                    ticket.StartWorkTime = updateDto.StartWorkTime;
                    ticket.TemporarilyStopped = false;
                    ticket.WorkFinished = false;
                }

                if (updateDto.FinishWorkTime != null)
                {
                    ticket.FinishWorkTime = updateDto.FinishWorkTime;
                }

                if (updateDto.WorkDuration.HasValue)
                {
                    ticket.WorkDuration = updateDto.WorkDuration.Value;
                }

                ticket.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                
                // Check if the ticket status changed to resolved or unresolved, regardless of workFinishedChanged
                bool isResolvedStatus = ticket.Status == "Résolu";
                bool wasResolvedStatus = previousStatus == "Résolu";
                bool resolutionStatusChanged = isResolvedStatus != wasResolvedStatus;
                bool isUnresolvedStatus = ticket.Status == "Non résolu";
                
                // Send notification to ticket creator if the resolution status changed in any way
                if ((workFinishedChanged || resolutionStatusChanged) && ticket.CreatedById.HasValue)
                {
                    try
                    {
                        _logger.LogInformation($"[WorkflowUpdate] Status or work finished changed. Previous status: {previousStatus}, New status: {ticket.Status}, Previous WorkFinished: {previousWorkFinished}, New WorkFinished: {ticket.WorkFinished}, Creator ID: {ticket.CreatedById.Value}");
                        // First get user info for correct routing
                        var creator = await _context.Users
                            .Where(u => u.Id == ticket.CreatedById.Value)
                            .Select(u => new { u.Id, u.Role })
                            .FirstOrDefaultAsync();
                        // Create a resolution notification
                        await _notificationService.CreateTicketResolvedNotificationAsync(
                            ticketId: id,
                            isResolved: isResolvedStatus,
                            recipientId: ticket.CreatedById!.Value
                        );
                        _logger.LogInformation($"[WorkflowUpdate] Created {(isResolvedStatus ? "resolved" : "unresolved")} notification for user {ticket.CreatedById.Value}");
                        // Also create a status change notification
                        if (statusChanged || resolutionStatusChanged)
                        {
                            await _notificationService.CreateTicketStatusChangeNotificationAsync(
                                ticketId: id,
                                ticketTitle: ticket.Title,
                                userId: ticket.CreatedById!.Value,
                                newStatus: ticket.Status
                            );
                            _logger.LogInformation($"[WorkflowUpdate] Created status change notification for user {ticket.CreatedById.Value}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"[WorkflowUpdate] Failed to create notification for ticket {id}");
                    }
                }
                else
                {
                    _logger.LogInformation($"[WorkflowUpdate] No notification sent: workFinishedChanged={workFinishedChanged}, resolutionStatusChanged={resolutionStatusChanged}, CreatedById={ticket.CreatedById}");
                }
                
                return Ok(new
                {
                    ticket.Id,
                    ticket.Title,
                    ticket.Status,
                    ticket.WorkFinished,
                    ticket.TemporarilyStopped,
                    ticket.WorkDuration,
                    CreatedById = ticket.CreatedById,
                    StatusChanged = statusChanged,
                    WorkFinishedChanged = workFinishedChanged,
                    NotificationSent = (workFinishedChanged || resolutionStatusChanged) && ticket.CreatedById.HasValue
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ticket workflow");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("{id}/assign/{userId}")]
        public async Task<IActionResult> AssignUserToTicket(int id, int userId)
        {
            try
            {
                _logger.LogInformation($"Assigning user {userId} to ticket {id}");

                // Get the ticket
                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.CreatedBy)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket with ID {id} not found");
                    return NotFound($"Ticket with ID {id} not found");
                }

                // Ensure the user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found");
                    return NotFound($"User with ID {userId} not found");
                }

                // Update the ticket's assigned user
                ticket.AssignedToId = userId;
                ticket.Status = "ASSIGNED";

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully assigned user {userId} to ticket {id}");
                    
                    // Create notification for the assignee
                    try
                    {
                        var notificationMessage = $"Vous avez été assigné(e) au ticket: '{ticket.Title}'";
                        
                        await _notificationService.CreateNotificationAsync(
                            userId: userId,
                            message: notificationMessage,
                            type: "TICKET_ASSIGNED",
                            relatedTicketId: ticket.Id);
                        
                        _logger.LogInformation($"Created assignment notification for user {userId}");
                    }
                    catch (Exception notifEx)
                    {
                        // Log but don't fail if notification creation fails
                        _logger.LogError(notifEx, $"Failed to create assignment notification: {notifEx.Message}");
                    }
                    
                    // Notify the ticket creator as well
                    if (ticket.CreatedById.HasValue && ticket.CreatedById.Value != userId)
                    {
                        try
                        {
                            var creatorMessage = $"Votre ticket '{ticket.Title}' a été assigné à {user.Name} {user.LastName}";
                            
                            await _notificationService.CreateNotificationAsync(
                                userId: ticket.CreatedById.Value,
                                message: creatorMessage,
                                type: "TICKET_ASSIGNED_NOTIFICATION",
                                relatedTicketId: ticket.Id);
                            
                            _logger.LogInformation($"Created ticket assignment notification for creator {ticket.CreatedById.Value}");
                        }
                        catch (Exception creatorNotifEx)
                        {
                            _logger.LogError(creatorNotifEx, $"Failed to create notification for ticket creator: {creatorNotifEx.Message}");
                        }
                    }
                    
                    // Notify admin users about the assignment
                    await _notificationService.CreateNotificationForAdminsAsync(
                        $"Le ticket \"{ticket?.Title ?? "Unknown"}\" a été assigné à un collaborateur",
                        $"/admin/tickets/{ticket?.Id ?? id}",
                        "TICKET_ASSIGNED",
                        ticket?.Id ?? id);
                    
                    return Ok(ticket);
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, $"Database error assigning user to ticket: {dbEx.Message}");
                    return StatusCode(500, $"Database error occurred while assigning the ticket: {dbEx.InnerException?.Message ?? dbEx.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error assigning user {userId} to ticket {id}: {ex.Message}");
                return StatusCode(500, $"An error occurred while assigning the ticket: {ex.Message}");
            }
        }

        [HttpPatch("{id}/assign")]
        public async Task<IActionResult> UpdateTicketAssignment(int id, [FromBody] UpdateTicketAssignmentDto updateDto)
        {
            try
            {
                _logger.LogInformation($"[UpdateTicketAssignment PATCH] Received request to assign ticket {id} to user {updateDto?.AssignedToId}");
                
                if (updateDto == null)
                {
                    _logger.LogWarning("[UpdateTicketAssignment] Request body is null");
                    return BadRequest("Request body is required");
                }

                if (updateDto.AssignedToId <= 0)
                {
                    _logger.LogWarning($"[UpdateTicketAssignment] Invalid AssignedToId: {updateDto.AssignedToId}");
                    return BadRequest("Invalid AssignedToId value");
                }
                
                // Get more ticket information for notification purposes
                var ticketInfo = await _context.Tickets
                    .Where(t => t.Id == id)
                    .Select(t => new { 
                        t.Id, 
                        t.Title, 
                        t.Status,
                        t.CreatedById,
                        ClientId = t.Project != null ? t.Project.ClientId : (int?)null,
                        ChefProjetId = t.Project != null ? t.Project.ChefProjetId : (int?)null
                    })
                    .FirstOrDefaultAsync();
                    
                if (ticketInfo == null)
                {
                    _logger.LogWarning($"[UpdateTicketAssignment] Ticket with ID {id} not found");
                    return NotFound($"Ticket with ID {id} not found");
                }
                
                // Check if user exists
                var assignedUser = await _context.Users
                    .Where(u => u.Id == updateDto.AssignedToId)
                    .Select(u => new { u.Id, u.Name, u.LastName, u.Role })
                    .FirstOrDefaultAsync();
                    
                if (assignedUser == null)
                {
                    _logger.LogWarning($"[UpdateTicketAssignment] User with ID {updateDto.AssignedToId} not found");
                    return NotFound($"User with ID {updateDto.AssignedToId} not found");
                }
                
                // Get the current status before update
                string previousStatus = ticketInfo.Status;
                
                // Execute direct SQL update instead of using FindAsync
                var updateCommand = $"UPDATE Tickets SET AssignedToId = {updateDto.AssignedToId}, Status = 'Assigné', updated_at = UTC_TIMESTAMP() WHERE Id = {id}";
                await _context.Database.ExecuteSqlRawAsync(updateCommand);
                
                _logger.LogInformation($"[UpdateTicketAssignment] Ticket details: Id={ticketInfo.Id}, Title='{ticketInfo.Title}', CreatedById={ticketInfo.CreatedById}, ClientId={ticketInfo.ClientId}, ChefProjetId={ticketInfo.ChefProjetId}");
                
                // Get the current user making the assignment
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int currentUserId = 0;
                if (currentUserIdClaim != null && int.TryParse(currentUserIdClaim.Value, out currentUserId))
                {
                    _logger.LogInformation($"[UpdateTicketAssignment] Assignment made by user {currentUserId}");
                }
                
                // Send notifications to the ticket creator if available
                if (ticketInfo.CreatedById.HasValue && ticketInfo.CreatedById.Value > 0)
                {
                    try
                    {
                        int creatorId = ticketInfo.CreatedById.Value;
                        _logger.LogInformation($"[UpdateTicketAssignment] Found ticket creator: {creatorId}");
                        
                        // 1. Create assignment notification
                        await _notificationService.CreateAssignmentNotificationAsync(
                            id,
                            creatorId,
                            updateDto.AssignedToId
                        );
                        
                        // 2. Also create a status change notification
                        if (previousStatus != "Assigné")
                        {
                            _logger.LogInformation($"[UpdateTicketAssignment] Creating status change notification for creator {creatorId}");
                            
                            await _notificationService.CreateTicketStatusNotificationAsync(
                                ticketId: id,
                                previousStatus: previousStatus,
                                newStatus: "Assigné",
                                clientId: creatorId
                            );
                        }
                        
                        _logger.LogInformation($"[UpdateTicketAssignment] Successfully created notifications for ticket creator {creatorId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating assignment notifications for ticket {TicketId}. Details: {Message}", id, ex.Message);
                        // Continue even if notification fails - do not rethrow
                    }
                }
                else
                {
                    _logger.LogWarning($"[UpdateTicketAssignment] No ticket creator found for ticket {id}, notifications skipped");
                }
                
                // Get minimal ticket info without problematic fields
                var updatedTicketInfo = await _context.Tickets
                    .Where(t => t.Id == id)
                    .Select(t => new { t.Id, t.Title, t.Status })
                    .FirstOrDefaultAsync();
                
                // Return basic response with ticket data
                return Ok(new 
                {
                    updatedTicketInfo?.Id,
                    updatedTicketInfo?.Title,
                    updatedTicketInfo?.Status,
                    AssignedToId = updateDto.AssignedToId,
                    AssignedToName = assignedUser.Name,
                    NotifiedUserId = ticketInfo.CreatedById
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UpdateTicketAssignment] Error assigning ticket {TicketId} to user {UserId}", id, updateDto?.AssignedToId);
                return StatusCode(500, new
                {
                    message = "An error occurred while processing your request",
                    error = ex.Message
                });
            }
        }

        [HttpPatch("{id}/work-duration")]
        public async Task<IActionResult> UpdateTicketWorkDuration(int id, [FromBody] UpdateWorkDurationDto updateDto)
        {
            try
            {
                _logger.LogInformation($"Updating work duration for ticket {id} to {updateDto.WorkDuration} seconds");

                var ticket = await _context.Tickets.FindAsync(id);
                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket with ID {id} not found");
                    return NotFound($"Ticket with ID {id} not found");
                }

                // Update work duration
                ticket.WorkDuration = updateDto.WorkDuration;
                ticket.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Successfully updated work duration for ticket {id}");

                return Ok(new
                {
                    ticket.Id,
                    ticket.WorkDuration,
                    ticket.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating work duration for ticket {id}");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}