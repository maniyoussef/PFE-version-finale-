using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.Models;

namespace SimSoftAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly IEmailService _emailService;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger, IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task CreateNotificationAsync(int userId, string message, string type, int? relatedTicketId = null, string? route = null)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating notification: Type={type}, UserId={userId}, RelatedTicketId={relatedTicketId}, Message=\"{message}\"");
                
                var notification = new Notification
                {
                    UserId = userId,
                    Message = message,
                    Type = type,
                    RelatedTicketId = relatedTicketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Saved notification with ID {notification.Id}: UserId={userId}, Message='{message}', Type={type}, RelatedTicketId={relatedTicketId}, Route={route}");
                
                // Send email notification
                await SendEmailNotificationAsync(userId, message, type, relatedTicketId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification for user {UserId}", userId);
                throw;
            }
        }

        public async Task CreateAssignmentNotificationAsync(int ticketId, int recipientId, int assignedToId)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating ASSIGNMENT notification for ticket {ticketId}, recipient: {recipientId}, assignee: {assignedToId}");

                // Use safer projection with minimal fields
                var ticketInfo = await _context.Tickets
                    .Where(t => t.Id == ticketId)
                    .Select(t => new {
                        t.Id,
                        t.Title,
                        t.CreatedById // CRITICAL FIX: Include the creator ID for validation
                    })
                    .FirstOrDefaultAsync();

                if (ticketInfo == null)
                {
                    _logger.LogWarning($"[NotificationService] Cannot create assignment notification - ticket {ticketId} not found");
                    return;
                }

                // Get assignee information separately to avoid joins
                var assignee = await _context.Users
                    .Where(u => u.Id == assignedToId)
                    .Select(u => new { u.Id, u.Name, u.Email })
                    .FirstOrDefaultAsync();
                    
                if (assignee == null)
                {
                    _logger.LogWarning($"[NotificationService] Cannot create assignment notification - assignee user {assignedToId} not found");
                    return;
                }

                // Create notification for the recipient (usually the creator)
                if (recipientId > 0)
                {
                    var notification = new Notification
                    {
                        UserId = recipientId,
                        Message = $"Le ticket \"{ticketInfo.Title}\" a été assigné à {assignee.Name}",
                        Type = "ASSIGNMENT",
                        RelatedTicketId = ticketId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        Route = $"/tickets/{ticketId}"
                    };

                    _context.Notifications.Add(notification);
                }

                // Create notification for the assignee
                var assigneeNotification = new Notification
                {
                    UserId = assignedToId,
                    Message = $"Vous avez été assigné au ticket \"{ticketInfo.Title}\"",
                    Type = "ASSIGNMENT",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = $"/collaborateur/tickets/{ticketId}"
                };

                _context.Notifications.Add(assigneeNotification);
                
                // Also create notification for all admins
                await CreateNotificationForAdminsAsync(
                    message: $"Le ticket \"{ticketInfo.Title}\" a été assigné à {assignee.Name}",
                    route: $"/admin/tickets/{ticketId}",
                    type: "TICKET_ASSIGNED",
                    relatedId: ticketId
                );

                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created assignment notifications for ticket {ticketId}");
                
                // Send email notifications
                if (recipientId > 0)
                {
                    var recipient = await _context.Users.FindAsync(recipientId);
                    if (recipient != null && !string.IsNullOrEmpty(recipient.Email))
                    {
                        await _emailService.SendNotificationEmailAsync(
                            email: recipient.Email,
                            userName: recipient.Name,
                            notificationType: "ASSIGNMENT",
                            message: $"Le ticket \"{ticketInfo.Title}\" a été assigné à {assignee.Name}",
                            relatedTicketId: ticketId,
                            userRole: recipient.Role?.ToString() ?? "CLIENT"
                        );
                        
                        _logger.LogInformation($"[NotificationService] Assignment notification email sent to recipient {recipient.Email}");
                    }
                }
                
                if (!string.IsNullOrEmpty(assignee.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: assignee.Email,
                        userName: assignee.Name,
                        notificationType: "ASSIGNMENT",
                        message: $"Vous avez été assigné au ticket \"{ticketInfo.Title}\"",
                        relatedTicketId: ticketId,
                        userRole: "COLLABORATEUR"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Assignment notification email sent to assignee {assignee.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assignment notifications for ticket {TicketId}. Details: {Message}, Stack: {StackTrace}", 
                    ticketId, ex.Message, ex.StackTrace);
                throw;
            }
        }

        public async Task CreateTicketCommentNotificationAsync(int ticketId, string commenterName, int clientId)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating comment notification for ticket {ticketId}, commenter: {commenterName}, client: {clientId}");

                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.Id == ticketId);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket {ticketId} not found when creating comment notification");
                    return;
                }

                var client = await _context.Users.FindAsync(clientId);
                if (client == null)
                {
                    _logger.LogWarning($"Client {clientId} not found when creating comment notification");
                    return;
                }

                var message = $"{commenterName} a ajouté un commentaire à votre ticket \"{ticket.Title}\"";
                var route = $"/user/mes-tickets/{ticketId}";

                var notification = new Notification
                {
                    UserId = clientId,
                    Message = message,
                    Type = "COMMENT_ADDED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created notification for user {clientId}: {message}");
                
                // Send email notification
                if (!string.IsNullOrEmpty(client.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: client.Email,
                        userName: client.Name,
                        notificationType: "COMMENT_ADDED",
                        message: message,
                        relatedTicketId: ticketId,
                        userRole: client.Role?.ToString() ?? "CLIENT"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Comment notification email sent to {client.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment notification for ticket {TicketId}", ticketId);
                throw;
            }
        }

        public async Task CreateTicketStatusNotificationAsync(int ticketId, string previousStatus, string newStatus, int clientId)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating status notification for ticket {ticketId}, previous status: {previousStatus}, new status: {newStatus}, client: {clientId}");

                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.Id == ticketId);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket {ticketId} not found when creating status notification");
                    return;
                }

                var client = await _context.Users.FindAsync(clientId);
                if (client == null)
                {
                    _logger.LogWarning($"Client {clientId} not found when creating status notification");
                    return;
                }

                var message = $"Le statut de votre ticket \"{ticket.Title}\" a été modifié de {previousStatus} à {newStatus}";
                var route = $"/user/mes-tickets/{ticketId}";

                var notification = new Notification
                {
                    UserId = clientId,
                    Message = message,
                    Type = "STATUS_CHANGED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created status notification for user {clientId}: {message}");
                
                // Send email notification
                if (!string.IsNullOrEmpty(client.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: client.Email,
                        userName: client.Name,
                        notificationType: "STATUS_CHANGED",
                        message: message,
                        relatedTicketId: ticketId,
                        userRole: client.Role?.ToString() ?? "CLIENT"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Status notification email sent to {client.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating status notification for ticket {TicketId}", ticketId);
                throw;
            }
        }

        public async Task CreateCommentNotificationAsync(int ticketId, string ticketTitle, string commenterName, int recipientId)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating comment notification for ticket {ticketId}, commenter: {commenterName}, recipient: {recipientId}");

                var recipient = await _context.Users.FindAsync(recipientId);
                if (recipient == null)
                {
                    _logger.LogWarning($"Recipient {recipientId} not found when creating comment notification");
                    return;
                }

                var message = $"{commenterName} a ajouté un commentaire à votre ticket \"{ticketTitle}\"";
                var route = $"/collaborateur/tickets/{ticketId}";

                var notification = new Notification
                {
                    UserId = recipientId,
                    Message = message,
                    Type = "COMMENT_ADDED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created comment notification for user {recipientId}: {message}");
                
                // Send email notification
                if (!string.IsNullOrEmpty(recipient.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: recipient.Email,
                        userName: recipient.Name,
                        notificationType: "COMMENT_ADDED",
                        message: message,
                        relatedTicketId: ticketId,
                        userRole: recipient.Role?.ToString() ?? "COLLABORATEUR"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Comment notification email sent to {recipient.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment notification for ticket {TicketId}", ticketId);
                throw;
            }
        }

        public async Task CreateTicketResolvedNotificationAsync(int ticketId, bool isResolved, int recipientId)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating resolution notification for ticket {ticketId}, isResolved: {isResolved}, recipient: {recipientId}");

                var ticket = await _context.Tickets
                    .Include(t => t.Project)
                    .FirstOrDefaultAsync(t => t.Id == ticketId);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket {ticketId} not found when creating resolution notification");
                    return;
                }

                var recipient = await _context.Users.FindAsync(recipientId);
                if (recipient == null)
                {
                    _logger.LogWarning($"Recipient {recipientId} not found when creating resolution notification");
                    return;
                }

                var message = isResolved 
                    ? $"Votre ticket \"{ticket.Title}\" a été marqué comme résolu"
                    : $"Votre ticket \"{ticket.Title}\" a été marqué comme non résolu";
                var route = $"/user/mes-tickets/{ticketId}";

                var notification = new Notification
                {
                    UserId = recipientId,
                    Message = message,
                    Type = "TICKET_RESOLVED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created resolution notification for user {recipientId}: {message}");
                
                // Send email notification
                if (!string.IsNullOrEmpty(recipient.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: recipient.Email,
                        userName: recipient.Name,
                        notificationType: "TICKET_RESOLVED",
                        message: message,
                        relatedTicketId: ticketId,
                        userRole: recipient.Role?.ToString() ?? "CLIENT"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Resolution notification email sent to {recipient.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating resolution notification for ticket {TicketId}", ticketId);
                throw;
            }
        }

        public async Task CreateNotificationForAdminsAsync(string message, string route, string type, int? relatedId = null)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating admin notification: Type={type}, Message=\"{message}\", Route={route}, RelatedId={relatedId}");

                // FIX: Use Role.Name for filtering admins
                var admins = await _context.Users
                    .Where(u => u.Role != null && u.Role.Name == "ADMIN")
                    .ToListAsync();

                foreach (var admin in admins)
                {
                    var notification = new Notification
                    {
                        UserId = admin.Id,
                        Message = message,
                        Type = type,
                        RelatedTicketId = relatedId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                        Route = route
                    };

                    _context.Notifications.Add(notification);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created notifications for {admins.Count()} admins");
                
                // Send email notifications
                foreach (var admin in admins)
                {
                    if (!string.IsNullOrEmpty(admin.Email))
                    {
                        await _emailService.SendNotificationEmailAsync(
                            email: admin.Email,
                            userName: admin.Name,
                            notificationType: type,
                            message: message,
                            relatedTicketId: relatedId,
                            userRole: "ADMIN"
                        );
                        
                        _logger.LogInformation($"[NotificationService] Admin notification email sent to {admin.Email}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin notifications");
                throw;
            }
        }

        private async Task SendEmailNotificationAsync(int userId, string message, string type, int? relatedTicketId = null)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || string.IsNullOrEmpty(user.Email))
                {
                    _logger.LogWarning($"User {userId} not found or has no email when sending notification");
                    return;
                }

                await _emailService.SendNotificationEmailAsync(
                    email: user.Email,
                    userName: user.Name,
                    notificationType: type,
                    message: message,
                    relatedTicketId: relatedTicketId,
                    userRole: user.Role?.ToString() ?? "USER"
                );

                _logger.LogInformation($"[NotificationService] Email notification sent to {user.Email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email notification to user {UserId}", userId);
                // Don't throw the exception - we don't want email failures to break the notification flow
            }
        }

        public async Task<Notification> CreateTicketStatusChangeNotificationAsync(int ticketId, string ticketTitle, int userId, string newStatus)
        {
            try
            {
                _logger.LogInformation($"[NotificationService] Creating status change notification for ticket {ticketId}, user: {userId}, new status: {newStatus}");

                var message = $"Le statut de votre ticket \"{ticketTitle}\" a été modifié à {newStatus}";
                var route = $"/user/mes-tickets/{ticketId}";

                var notification = new Notification
                {
                    UserId = userId,
                    Message = message,
                    Type = "STATUS_CHANGED",
                    RelatedTicketId = ticketId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    Route = route
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[NotificationService] Successfully created status change notification for user {userId}: {message}");
                
                // Send email notification
                var user = await _context.Users.FindAsync(userId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _emailService.SendNotificationEmailAsync(
                        email: user.Email,
                        userName: user.Name,
                        notificationType: "STATUS_CHANGED",
                        message: message,
                        relatedTicketId: ticketId,
                        userRole: user.Role?.ToString() ?? "USER"
                    );
                    
                    _logger.LogInformation($"[NotificationService] Status change notification email sent to {user.Email}");
                }

                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating status change notification for ticket {TicketId}", ticketId);
                throw;
            }
        }
    }
} 