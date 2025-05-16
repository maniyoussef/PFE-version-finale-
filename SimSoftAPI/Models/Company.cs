using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimSoftAPI.Models
{
   public class Company
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string ContactPerson { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    

    public string? Phone { get; set; }="" ;

    public string? Address { get; set; } = string.Empty;
            public ICollection<User> Users { get; set; } = new List<User>();

}

}
