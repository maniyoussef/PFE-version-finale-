using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
    public class ProjectChef
    {
        [Key]
        public int Id { get; set; }
        
        public int ProjectId { get; set; }
        public int ChefProjetId { get; set; }
        public DateTime AssignedDate { get; set; }

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }
        
        [ForeignKey("ChefProjetId")]
        public virtual User ChefProjet { get; set; }
    }
} 