using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SimSoftAPI.Models
{
    public class Ticket
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = "Open";

        [Required]
        public string Priority { get; set; } = string.Empty;

        [Required]
        public string Qualification { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int ProblemCategoryId { get; set; }

        public int? ClientId { get; set; }
        
        public int? CreatedById { get; set; }
        
        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; } = null!;

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; } = null!;

        [ForeignKey("ProblemCategoryId")]
        public virtual ProblemCategory ProblemCategory { get; set; } = null!;

        public int? AssignedToId { get; set; }

        [ForeignKey("AssignedToId")]
        public virtual User AssignedTo { get; set; } = null!;
        
        [ForeignKey("ClientId")]
        public virtual User Client { get; set; }
        
        public string Attachment { get; set; } = string.Empty;
        
        [Column("rapport")] // Ensure this matches database column name
        public string Report { get; set; } = string.Empty;

        public string Commentaire { get; set; } = string.Empty;
    
        public DateTime? UpdatedAt { get; set; }

        // Workflow properties
        public bool TemporarilyStopped { get; set; } = false;
        public bool WorkFinished { get; set; } = false;
        public string? StartWorkTime { get; set; }
        public string? FinishWorkTime { get; set; }
        public int? WorkDuration { get; set; } // Duration in seconds

        // For backward compatibility
        public DateTime CreatedDate 
        { 
            get => CreatedAt;
            set => CreatedAt = value;
        }
    }
}