using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace SimSoftAPI.Services
{
    public class TicketService : ITicketService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TicketService> _logger;

        public TicketService(AppDbContext context, ILogger<TicketService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Ticket>> GetTicketsAsync()
        {
            try {
                _logger.LogInformation("TicketService: Fetching all tickets");
                
                // Use explicit projection to avoid the ClientId field issue
                var ticketDtos = await _context.Tickets
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
                        } : null
                    })
                    .ToListAsync();
                    
                // Convert DTOs back to Ticket entities
                var tickets = ticketDtos.Select(dto => new Ticket
                {
                    Id = dto.Id,
                    Title = dto.Title,
                    Description = dto.Description,
                    Status = dto.Status,
                    Priority = dto.Priority,
                    Qualification = dto.Qualification,
                    ProjectId = dto.ProjectId,
                    ProblemCategoryId = dto.ProblemCategoryId,
                    AssignedToId = dto.AssignedToId,
                    CreatedDate = dto.CreatedDate,
                    UpdatedAt = dto.UpdatedAt,
                    Report = dto.Report,
                    Attachment = dto.Attachment,
                    Commentaire = dto.Commentaire,
                    CreatedById = dto.CreatedById,
                    StartWorkTime = dto.StartWorkTime,
                    FinishWorkTime = dto.FinishWorkTime,
                    WorkDuration = dto.WorkDuration,
                    TemporarilyStopped = dto.TemporarilyStopped,
                    WorkFinished = dto.WorkFinished,
                    // Reconstruct navigation properties
                    Project = dto.Project != null ? new Project
                    {
                        Id = dto.Project.Id,
                        Name = dto.Project.Name,
                        Description = dto.Project.Description,
                        Status = dto.Project.Status,
                        ClientId = dto.Project.ClientId,
                        ChefProjetId = dto.Project.ChefProjetId
                    } : null,
                    ProblemCategory = dto.ProblemCategory != null ? new ProblemCategory
                    {
                        Id = dto.ProblemCategory.Id,
                        Name = dto.ProblemCategory.Name
                    } : null
                }).ToList();
                
                _logger.LogInformation($"TicketService: Retrieved {tickets.Count} tickets");
                return tickets;
            }
            catch (Exception ex) {
                _logger.LogError(ex, "TicketService: Error retrieving all tickets: {Message}, Stack: {Stack}", 
                    ex.Message, ex.StackTrace);
                throw;
            }
        }

        public async Task<Ticket> CreateTicketAsync(Ticket ticket)
        {
            // Always explicitly set the created date in the service layer
            ticket.CreatedDate = DateTime.UtcNow;
            
            // Set default status if not provided
            if (string.IsNullOrEmpty(ticket.Status))
                ticket.Status = "Open";
                
            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();
            return ticket;
        }

        public async Task<List<Ticket>> GetUserTicketsAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"TicketService: Fetching tickets for user ID: {userId}");

                // Get tickets associated with projects where the user is a client
                var projectIds = await _context.Projects
                    .Where(p => p.ClientId == userId)
                    .Select(p => p.Id)
                    .ToListAsync();
                
                _logger.LogInformation($"TicketService: Found {projectIds.Count} projects where user {userId} is client");
                
                // Make sure we have projects before trying to use projectIds
                if (projectIds.Count == 0)
                {
                    _logger.LogInformation($"TicketService: No projects found for user {userId}, returning empty list");
                    return new List<Ticket>();
                }
                
                // Use explicit projection to avoid the ClientId field issue
                var ticketDtos = await _context.Tickets
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
                            t.AssignedTo.Email,
                            t.AssignedTo.Role
                        } : null
                    })
                    .OrderByDescending(t => t.CreatedDate)
                    .ToListAsync();
                
                // Convert DTOs back to Ticket entities
                var tickets = ticketDtos.Select(dto => new Ticket
                {
                    Id = dto.Id,
                    Title = dto.Title,
                    Description = dto.Description,
                    Status = dto.Status,
                    Priority = dto.Priority,
                    Qualification = dto.Qualification,
                    ProjectId = dto.ProjectId,
                    ProblemCategoryId = dto.ProblemCategoryId,
                    AssignedToId = dto.AssignedToId,
                    CreatedDate = dto.CreatedDate,
                    UpdatedAt = dto.UpdatedAt,
                    Report = dto.Report,
                    Attachment = dto.Attachment,
                    Commentaire = dto.Commentaire,
                    CreatedById = dto.CreatedById,
                    StartWorkTime = dto.StartWorkTime,
                    FinishWorkTime = dto.FinishWorkTime,
                    WorkDuration = dto.WorkDuration,
                    TemporarilyStopped = dto.TemporarilyStopped,
                    WorkFinished = dto.WorkFinished,
                    // Reconstruct navigation properties
                    Project = dto.Project != null ? new Project
                    {
                        Id = dto.Project.Id,
                        Name = dto.Project.Name,
                        Description = dto.Project.Description,
                        Status = dto.Project.Status,
                        ClientId = dto.Project.ClientId,
                        ChefProjetId = dto.Project.ChefProjetId
                    } : null,
                    ProblemCategory = dto.ProblemCategory != null ? new ProblemCategory
                    {
                        Id = dto.ProblemCategory.Id,
                        Name = dto.ProblemCategory.Name
                    } : null,
                    AssignedTo = dto.AssignedTo != null ? new User
                    {
                        Id = dto.AssignedTo.Id,
                        Name = dto.AssignedTo.Name,
                        Email = dto.AssignedTo.Email,
                        Role = dto.AssignedTo.Role
                    } : null
                }).ToList();
                
                _logger.LogInformation($"TicketService: Found {tickets.Count} tickets for user {userId}");
                
                return tickets;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"TicketService: Error fetching tickets for user {userId}: {{Message}}, Stack: {{Stack}}", 
                    ex.Message, ex.StackTrace);
                throw; // Re-throw to handle in controller
            }
        }
    }
}