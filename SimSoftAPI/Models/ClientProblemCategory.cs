using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
    public class ClientProblemCategory
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ClientId { get; set; }
        
        [Required]
        public int ProblemCategoryId { get; set; }
        
        public DateTime AssignedDate { get; set; }
        
        [ForeignKey("ClientId")]
        public virtual User Client { get; set; }
        
        [ForeignKey("ProblemCategoryId")]
        public virtual ProblemCategory ProblemCategory { get; set; }
    }
} 