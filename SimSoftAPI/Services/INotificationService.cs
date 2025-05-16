using System.Collections.Generic;
using System.Threading.Tasks;
using SimSoftAPI.Models;

namespace SimSoftAPI.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(int userId, string message, string type, int? relatedTicketId = null, string? route = null);
        Task CreateTicketCommentNotificationAsync(int ticketId, string commenterName, int clientId);
        Task CreateTicketStatusNotificationAsync(int ticketId, string previousStatus, string newStatus, int clientId);
        Task CreateCommentNotificationAsync(int ticketId, string ticketTitle, string commenterName, int recipientId);
        Task CreateAssignmentNotificationAsync(int ticketId, int recipientId, int assignedToId);
        Task CreateTicketResolvedNotificationAsync(int ticketId, bool isResolved, int recipientId);
        Task CreateNotificationForAdminsAsync(string message, string route, string type, int? relatedId = null);
        Task<Notification> CreateTicketStatusChangeNotificationAsync(int ticketId, string ticketTitle, int userId, string newStatus);
    }
} 