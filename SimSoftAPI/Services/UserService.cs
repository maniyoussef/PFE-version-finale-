using SimSoftAPI.Data;
using SimSoftAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;

namespace SimSoftAPI.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

  public async Task<User> GetUserByEmailAsync(string email)
{
    return await _context.Users
        .Where(u => u.Email == email) // Correct column reference
        .FirstOrDefaultAsync();
}

        public async Task<User> CreateUserAsync(RegisterDto model, string password)
        {
            // Hash the password
            string hashedPassword = HashPassword(password);
            
            var user = new User
            {
                Email = model.Email,
                Name = model.Name,
                LastName = string.Empty, // Added default value for LastName
                CountryId = 1, // Assume country is seeded with ID 1
                RoleId = 2, // Assume user role has ID 2
                PasswordHash = hashedPassword
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

  public async Task<IList<string>> GetRolesAsync(User user)
{
    // Since it's a many-to-one relationship, each user has one role
    var role = await _context.Users
        .Where(u => u.Id == user.Id)
        .Select(u => u.Role.Name)
        .FirstOrDefaultAsync();

    return new List<string> { role };
}
        
        public bool VerifyPassword(string storedHash, string password)
        {
            return storedHash == HashPassword(password);
        }
        
        private string HashPassword(string password)
        {
            // Simple hashing for development - in production use a more secure method
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(password));
                
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}