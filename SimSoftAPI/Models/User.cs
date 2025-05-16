using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int CountryId { get; set; }
        public int RoleId { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime? ContractStartDate { get; set; }
        public DateTime? ContractEndDate { get; set; }
        
        // Password reset fields
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpires { get; set; }

        [ForeignKey("CountryId")]
        public virtual Country? Country { get; set; }

        [ForeignKey("RoleId")]
        public virtual Role? Role { get; set; }
          public int? ChefProjetId { get; set; }  // Add this property

    [ForeignKey("ChefProjetId")]
    public virtual User? ChefProjet { get; set; }  // Add this navigation property


        public virtual ICollection<Project> AssignedProjects { get; set; } = new List<Project>();
        public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
        public virtual ICollection<User> AssignedCollaborateurs { get; set; } = new List<User>();
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
        public virtual ICollection<ProblemCategory> AssignedProblemCategories { get; set; } = new List<ProblemCategory>();
    }
}