using System.ComponentModel.DataAnnotations;


namespace SimSoftAPI.DTOs
{
    public class TicketDto
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Qualification { get; set; }
        public int ProjectId { get; set; }
        public int ProblemCategoryId { get; set; }
        public required string Priority { get; set; }
        public int? AssignedToId { get; set; }
        public string Attachment { get; set; } = string.Empty;
        public string? Status { get; set; } // Add status field
        public string Commentaire { get; set; } = string.Empty;
        public string? Report { get; set; } // New field for the report
        public bool TemporarilyStopped { get; set; } = false;
        public bool WorkFinished { get; set; } = false;
        public string? StartWorkTime { get; set; }
        public string? FinishWorkTime { get; set; }
        public int? WorkDuration { get; set; }
    }
}