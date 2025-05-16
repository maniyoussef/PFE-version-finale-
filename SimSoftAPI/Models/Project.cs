using System.ComponentModel.DataAnnotations;

namespace SimSoftAPI.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? ChefProjetId { get; set; }
        public int? ClientId { get; set; }


        public virtual User? ChefProjet { get; set; }
        public virtual User? Client { get; set; }
        public virtual ICollection<User> Collaborateurs { get; set; } = new List<User>();
        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}