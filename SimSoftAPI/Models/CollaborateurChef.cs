using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
    public class CollaborateurChef
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int CollaborateurId { get; set; }
        
        [Required]
        public int ChefProjetId { get; set; }
        
        public DateTime AssignedDate { get; set; }
        
        [ForeignKey("CollaborateurId")]
        public virtual User Collaborateur { get; set; }
        
        [ForeignKey("ChefProjetId")]
        public virtual User ChefProjet { get; set; }
    }
} 