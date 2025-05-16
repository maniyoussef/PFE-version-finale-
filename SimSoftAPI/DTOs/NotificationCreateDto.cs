using System;

namespace SimSoftAPI.DTOs
{
    public class NotificationCreateDto
    {
        public int UserId { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public int? RelatedTicketId { get; set; }
        public string Route { get; set; }
        public DateTime? Timestamp { get; set; }
    }
} 