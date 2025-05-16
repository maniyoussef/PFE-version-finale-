using System.ComponentModel.DataAnnotations;

namespace SimSoftAPI.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public int CountryId { get; set; }
        
        [Required]
        public int RoleId { get; set; }
    }
}