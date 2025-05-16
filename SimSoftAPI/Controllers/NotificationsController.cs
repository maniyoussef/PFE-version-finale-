using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System.Linq;
using System.IO;
using System.Text.Json;
using SimSoftAPI.DTOs;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(AppDbContext context, ILogger<NotificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int userId)
        {
            try
            {
                _logger.LogInformation($"[Notification] Fetching notifications for user {userId}");

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation($"[Notification] Found {notifications.Count} notifications for user {userId}");
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching notifications for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return Ok(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {Id} as read", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPatch("user/{userId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = $"Marked {notifications.Count} notifications as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Notification deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("user/{userId}")]
        public async Task<IActionResult> DeleteAllUserNotifications(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();

                _context.Notifications.RemoveRange(notifications);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Deleted {notifications.Count} notifications" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all notifications for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationCreateDto dto)
        {
            _logger.LogInformation($"[Notification] Received notification payload: {JsonSerializer.Serialize(dto)}");

            if (dto == null || dto.UserId == 0 || string.IsNullOrEmpty(dto.Message))
            {
                return BadRequest("Invalid notification data");
            }

            var notification = new Notification
            {
                UserId = dto.UserId,
                Message = dto.Message,
                Type = dto.Type,
                RelatedTicketId = dto.RelatedTicketId,
                Route = dto.Route,
                CreatedAt = dto.Timestamp ?? DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[Notification] Created notification for user {notification.UserId} via API");
            return Ok(notification);
        }

        [HttpPost("chef-projet/{chefProjetId}/verify")]
        public async Task<IActionResult> VerifyChefProjetNotifications(int chefProjetId)
        {
            try
            {
                _logger.LogInformation($"[Notification] Verifying notifications for Chef Projet {chefProjetId}");
                
                // Check if Chef Projet exists
                var chefProjet = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == chefProjetId);
                    
                if (chefProjet == null)
                {
                    return NotFound($"Chef Projet with ID {chefProjetId} not found");
                }
                
                // Get a project for this Chef Projet to use for test notifications
                var project = await _context.Projects
                    .Where(p => p.ChefProjetId == chefProjetId)
                    .FirstOrDefaultAsync();
                    
                if (project == null)
                {
                    return BadRequest($"No projects found for Chef Projet {chefProjetId}");
                }
                
                // Get a ticket from this project to use
                var ticket = await _context.Tickets
                    .Where(t => t.ProjectId == project.Id)
                    .FirstOrDefaultAsync();
                    
                int ticketId = ticket?.Id ?? -1;
                string ticketTitle = ticket?.Title ?? "Test Ticket";
                
                // Create test notifications for all types
                var testNotifications = new List<Notification>();
                DateTime now = DateTime.UtcNow;
                
                // 1. New ticket notification
                var newTicketNotification = new Notification
                {
                    UserId = chefProjetId,
                    Message = $"TEST: Un nouveau ticket a été créé dans votre projet: \"{ticketTitle}\"",
                    Type = "NEW_TICKET",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = now,
                    Route = $"/chef-projet/tickets/{ticketId}"
                };
                testNotifications.Add(newTicketNotification);
                
                // 2. Comment notification
                var commentNotification = new Notification
                {
                    UserId = chefProjetId,
                    Message = $"TEST: Un utilisateur a ajouté un commentaire au ticket \"{ticketTitle}\" de votre projet",
                    Type = "COMMENT_ADDED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = now.AddSeconds(1),
                    Route = $"/chef-projet/tickets/{ticketId}"
                };
                testNotifications.Add(commentNotification);
                
                // 3. Resolved notification
                var resolvedNotification = new Notification
                {
                    UserId = chefProjetId,
                    Message = $"TEST: Le ticket \"{ticketTitle}\" de votre projet a été résolu",
                    Type = "TICKET_RESOLVED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = now.AddSeconds(2),
                    Route = $"/chef-projet/tickets/{ticketId}"
                };
                testNotifications.Add(resolvedNotification);
                
                // 4. Unresolved notification
                var unresolvedNotification = new Notification
                {
                    UserId = chefProjetId,
                    Message = $"TEST: Le ticket \"{ticketTitle}\" de votre projet a été marqué comme non résolu",
                    Type = "TICKET_UNRESOLVED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = now.AddSeconds(3),
                    Route = $"/chef-projet/tickets/{ticketId}"
                };
                testNotifications.Add(unresolvedNotification);
                
                // Add all test notifications
                _context.Notifications.AddRange(testNotifications);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"[Notification] Created {testNotifications.Count} test notifications for Chef Projet {chefProjetId}");
                
                return Ok(new {
                    message = $"Successfully created {testNotifications.Count} test notifications for Chef Projet {chefProjetId}",
                    notifications = testNotifications
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error verifying notifications for Chef Projet {chefProjetId}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
} 