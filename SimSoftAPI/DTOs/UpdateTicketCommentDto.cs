using System;

namespace SimSoftAPI.DTOs
{
    public class UpdateTicketCommentDto
    {
        public string? Commentaire { get; set; }
        public string? Report { get; set; }
        public int? NotifyUserId { get; set; }
        public string? CommenterName { get; set; }
    }
} 