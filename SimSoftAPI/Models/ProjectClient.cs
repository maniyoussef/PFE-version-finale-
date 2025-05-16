using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
    public class ProjectClient
    {
        [Key]
        public int Id { get; set; }

        public int ProjectId { get; set; }
        
        public int ClientId { get; set; }

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; }
    }
} 