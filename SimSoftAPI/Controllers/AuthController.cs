namespace SimSoftAPI.Controllers
{
    using SimSoftAPI.Models;
    using SimSoftAPI.Services;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.IdentityModel.Tokens;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Text;
    using Microsoft.Extensions.Configuration;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using System;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.EntityFrameworkCore;
    using SimSoftAPI.Data;
    using System.Security.Cryptography;

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public AuthController(IConfiguration configuration, IUserService userService, AppDbContext context, IEmailService emailService)
        {
            _configuration = configuration;
            _userService = userService;
            _context = context;
            _emailService = emailService;
        }

       // AuthController.cs
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto model)
{
    var user = await _userService.GetUserByEmailAsync(model.Email);
    if (user == null || !_userService.VerifyPassword(user.PasswordHash, model.Password))
    {
        return Unauthorized(new { message = "Invalid credentials" });
    }

    var userRoles = await _userService.GetRolesAsync(user);
    var expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    var token = GenerateJwtToken(user.Id.ToString(), user.Email, userRoles);

    return Ok(new AuthResponseDto
    {
        Token = token,
        ExpiresIn = expiresIn,
        User = new UserDto
        {
            Id = user.Id.ToString(),
            Email = user.Email,
            Name = user.Name,
            LastName = user.LastName,
            Roles = userRoles.ToList()
        }
    });
}

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            try
            {
                if (model == null || string.IsNullOrEmpty(model.OldPassword) || string.IsNullOrEmpty(model.NewPassword))
                {
                    return BadRequest(new { message = "Informations de mot de passe invalides" });
                }

                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "Session utilisateur invalide" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "Utilisateur non trouvé" });
                }

                // Verify old password
                if (!VerifyPassword(user.PasswordHash, model.OldPassword))
                {
                    return Unauthorized(new { message = "Mot de passe actuel incorrect" });
                }

                // Update password
                user.PasswordHash = HashPassword(model.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Mot de passe changé avec succès" });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error changing password: {ex.Message}");
                return StatusCode(500, new { message = "Erreur lors du changement de mot de passe" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Email))
                {
                    return BadRequest(new { message = "L'adresse email est requise" });
                }

                var user = await _userService.GetUserByEmailAsync(model.Email);
                if (user == null)
                {
                    // Return success even if the email doesn't exist to prevent email enumeration attacks
                    return Ok(new { message = "Si votre adresse email est correcte, vous recevrez un lien de réinitialisation." });
                }

                // Generate reset token
                var token = GeneratePasswordResetToken(user.Id);

                // Save token to database with expiration time
                user.PasswordResetToken = token;
                user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1);
                await _context.SaveChangesAsync();

                // Send email with reset link
                await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, token);

                return Ok(new { message = "Si votre adresse email est correcte, vous recevrez un lien de réinitialisation." });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error requesting password reset: {ex.Message}");
                return StatusCode(500, new { message = "Erreur lors de la demande de réinitialisation de mot de passe" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Token) || string.IsNullOrEmpty(model.NewPassword))
                {
                    return BadRequest(new { message = "Tous les champs sont requis" });
                }

                var user = await _userService.GetUserByEmailAsync(model.Email);
                if (user == null || user.PasswordResetToken != model.Token || !user.PasswordResetTokenExpires.HasValue || user.PasswordResetTokenExpires < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Le lien de réinitialisation est invalide ou a expiré" });
                }

                // Update password
                user.PasswordHash = HashPassword(model.NewPassword);
                
                // Clear reset token
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpires = null;
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Votre mot de passe a été réinitialisé avec succès" });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error resetting password: {ex.Message}");
                return StatusCode(500, new { message = "Erreur lors de la réinitialisation du mot de passe" });
            }
        }

        // Helper method to generate a password reset token
        private string GeneratePasswordResetToken(int userId)
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            
            // Add a timestamp and user ID to the token to make it unique
            string tokenBase = Convert.ToBase64String(randomBytes);
            string timestampPart = DateTime.UtcNow.Ticks.ToString();
            string userPart = userId.ToString();
            
            // Combine parts and hash
            string combined = $"{tokenBase}_{timestampPart}_{userPart}";
            return HashString(combined);
        }
        
        private string HashString(string input)
        {
            using var sha256Hash = SHA256.Create();
            var bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(input));
            var builder = new StringBuilder();
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }

        private string HashPassword(string password)
        {
            using var sha256Hash = SHA256.Create();
            var bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(password));
            var builder = new StringBuilder();
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }

        private bool VerifyPassword(string storedHash, string password)
        {
            return storedHash == HashPassword(password);
        }

        private string GenerateJwtToken(string userId, string email, IEnumerable<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "defaultSecretKey123456789012345678901234"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(7);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"] ?? "SimSoftAPI",
                _configuration["Jwt:Audience"] ?? "SimSoftClient",
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
    
    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }
    
    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
