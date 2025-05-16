using System.ComponentModel.DataAnnotations;

namespace SimSoftAPI.DTOs
{
    public class UserUpdateDto
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Name is required")]
        public string Name { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Last name is required")]
        public string LastName { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Country is required")]
        [Range(1, int.MaxValue)]
        public int CountryId { get; set; }
        
        [Required(ErrorMessage = "Role is required")]
        [Range(1, int.MaxValue)]
        public int RoleId { get; set; }
        
        public string? PhoneNumber { get; set; }
        public DateTime? ContractStartDate { get; set; }
        public DateTime? ContractEndDate { get; set; }
        
        // Add these new properties
        public int? ProjectId { get; set; }
        public List<int> CompanyIds { get; set; } = new();
    }
}