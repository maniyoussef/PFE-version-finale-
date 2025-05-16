namespace SimSoftAPI.DTOs
{
    public class UpdateTicketWorkflowDto
    {
        public bool? TemporarilyStopped { get; set; }
        public bool? WorkFinished { get; set; }
        public string? StartWorkTime { get; set; }
        public string? FinishWorkTime { get; set; }
        public int? WorkDuration { get; set; }
    }
} 