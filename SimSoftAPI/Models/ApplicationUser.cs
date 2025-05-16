using Microsoft.AspNetCore.Identity;

namespace SimSoftAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; }
    }
}