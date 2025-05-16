namespace SimSoftAPI.Services
{
    public interface IEmailService
    {
        Task SendUserCredentialsAsync(string email, string username, string password);
        
        // New method to send notification emails
        Task SendNotificationEmailAsync(string email, string userName, string notificationType, string message, int? relatedTicketId = null, string userRole = "USER");
        
        // Method to send password reset email
        Task SendPasswordResetEmailAsync(string email, string userName, string resetToken);
    }
}