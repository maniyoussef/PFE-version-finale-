using System.ComponentModel.DataAnnotations;

namespace SimSoftAPI.DTOs
{
    public class UpdateWorkDurationDto
    {
        [Required]
        public int WorkDuration { get; set; }
    }
} 