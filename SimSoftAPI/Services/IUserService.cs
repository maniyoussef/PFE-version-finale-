using System.Collections.Generic;
using System.Threading.Tasks;
using SimSoftAPI.Models;

namespace SimSoftAPI.Services
{
    public interface IUserService
    {
        Task<User> GetUserByEmailAsync(string email);
        Task<User> CreateUserAsync(RegisterDto model, string password);
        Task<IList<string>> GetRolesAsync(User user);
        bool VerifyPassword(string storedHash, string password);
    }
}