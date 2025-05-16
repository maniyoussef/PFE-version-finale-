using System.ComponentModel.DataAnnotations;

namespace SimSoftAPI.DTOs
{
    public class AssignProblemCategoryToClientDto
    {
        [Required]
        public int ClientId { get; set; }
        
        [Required]
        public int ProblemCategoryId { get; set; }
    }
} 