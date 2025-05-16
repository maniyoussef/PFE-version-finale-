using System.Net;
using System.Net.Mail;

namespace SimSoftAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _smtpUser;
        private readonly string _smtpPassword;
        private readonly bool _enableSsl;
        private readonly string _frontendUrl;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            var smtpConfig = configuration.GetSection("Smtp");
            _smtpServer = smtpConfig["Server"] ?? throw new ArgumentNullException("Smtp:Server");
            _smtpPort = int.Parse(smtpConfig["Port"] ?? "587");
            _smtpUser = smtpConfig["Username"] ?? throw new ArgumentNullException("Smtp:Username");
            _smtpPassword = smtpConfig["Password"] ?? throw new ArgumentNullException("Smtp:Password");
            _enableSsl = bool.Parse(smtpConfig["EnableSSL"] ?? "true");
            _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:4200"; // Get frontend URL from config
            _logger = logger;
        }

        public async Task SendUserCredentialsAsync(string email, string username, string password)
        {
            try
            {
                using var smtpClient = new SmtpClient(_smtpServer)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUser, _smtpPassword),
                    EnableSsl = _enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };

                // Create HTML body with modern design
                string htmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ff7043; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }}
                        .credentials {{ background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff7043; margin: 20px 0; }}
                        .important-note {{ background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px; }}
                        .button {{ display: inline-block; background-color: #ff7043; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #eee; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Bienvenue sur SimSoft</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour {username},</p>
                            <p>Votre compte a été créé avec succès sur la plateforme SimSoft. Voici vos identifiants de connexion :</p>
                            
                            <div class='credentials'>
                                <p><strong>Nom d'utilisateur :</strong> {username}</p>
                                <p><strong>Mot de passe :</strong> {password}</p>
                            </div>
                            
                            <div class='important-note'>
                                <p><strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                            </div>
                            
                            <a href='{GetAppUrl()}' class='button'>Accéder à la plateforme</a>
                            
                            <div class='footer'>
                                <p>Si vous n'avez pas demandé la création de ce compte, veuillez nous contacter immédiatement.</p>
                                <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                                <p>&copy; {DateTime.Now.Year} SimSoft. Tous droits réservés.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>";

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_smtpUser),
                    Subject = "SimSoft - Vos identifiants de connexion",
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                _logger.LogInformation($"Attempting to send credentials email to {email}");
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Credentials email sent successfully to {email}");
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError($"SMTP error sending credentials email to {email}: {smtpEx.Message}");
                throw new Exception($"Failed to send email: {smtpEx.Message}", smtpEx);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error sending credentials email to {email}: {ex.Message}");
                throw new Exception("Failed to send email due to an unexpected error", ex);
            }
        }
        
        public async Task SendNotificationEmailAsync(string email, string userName, string notificationType, string message, int? relatedTicketId = null, string userRole = "USER")
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning("Cannot send notification email: Email address is null or empty");
                    return;
                }

                using var smtpClient = new SmtpClient(_smtpServer)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUser, _smtpPassword),
                    EnableSsl = _enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };

                // Create subject based on notification type
                string subject = GetNotificationSubject(notificationType, relatedTicketId);
                
                // Get ticket info reference
                string ticketReference = relatedTicketId.HasValue ? $"Ticket #{relatedTicketId}" : "";
                
                // Create email body with HTML
                string htmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ff7043; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }}
                        .notification-message {{ background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff7043; margin-bottom: 20px; }}
                        .ticket-info {{ background-color: #f0f0f0; padding: 10px; margin-top: 15px; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>SimSoft Notification</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour {userName},</p>
                            <p>Vous avez reçu une notification sur la plateforme SimSoft :</p>
                            
                            <div class='notification-message'>
                                {message}
                            </div>
                            
                            {(relatedTicketId.HasValue ? $@"
                            <div class='ticket-info'>
                                <strong>Référence:</strong> {ticketReference}<br/>
                                <strong>Type:</strong> {notificationType}
                            </div>
                            " : "")}
                            
                            <p>Pour plus de détails, veuillez vous connecter à votre espace {GetRolePortalName(userRole)} sur la plateforme SimSoft.</p>
                            
                            <div class='footer'>
                                <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                                <p>&copy; {DateTime.Now.Year} SimSoft. Tous droits réservés.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>";

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_smtpUser),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                _logger.LogInformation($"Sending notification email to {email} regarding {notificationType}");
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Notification email sent successfully to {email}");
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError($"SMTP error sending notification email to {email}: {smtpEx.Message}");
                // Don't throw exception so that the notification service can continue
                // even if email sending fails
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error sending notification email to {email}: {ex.Message}");
                // Don't throw exception so that the notification service can continue
                // even if email sending fails
            }
        }
        
        private string GetNotificationSubject(string notificationType, int? ticketId)
        {
            string ticketInfo = ticketId.HasValue ? $" - Ticket #{ticketId}" : "";
            
            switch (notificationType.ToUpper())
            {
                case "NEW_TICKET":
                    return $"SimSoft - Nouveau ticket{ticketInfo}";
                case "TICKET_ASSIGNED":
                    return $"SimSoft - Ticket assigné{ticketInfo}";
                case "TICKET_STATUS_CHANGED":
                    return $"SimSoft - Changement de statut{ticketInfo}";
                case "TICKET_RESOLVED":
                    return $"SimSoft - Ticket résolu{ticketInfo}";
                case "TICKET_UNRESOLVED":
                    return $"SimSoft - Ticket non résolu{ticketInfo}";
                case "COMMENT_ADDED":
                    return $"SimSoft - Nouveau commentaire{ticketInfo}";
                case "REPORT_CREATED":
                    return $"SimSoft - Nouveau rapport{ticketInfo}";
                default:
                    return $"SimSoft - Nouvelle notification{ticketInfo}";
            }
        }
        
        private string GetRolePortalName(string userRole)
        {
            switch (userRole.ToUpper())
            {
                case "ADMIN":
                    return "administrateur";
                case "CHEF_PROJET":
                    return "chef de projet";
                case "COLLABORATEUR":
                    return "collaborateur";
                case "CLIENT":
                    return "client";
                case "USER":
                default:
                    return "utilisateur";
            }
        }

        private string GetAppUrl()
        {
            return _frontendUrl;
        }
        
        public async Task SendPasswordResetEmailAsync(string email, string userName, string resetToken)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning("Cannot send password reset email: Email address is null or empty");
                    return;
                }

                using var smtpClient = new SmtpClient(_smtpServer)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUser, _smtpPassword),
                    EnableSsl = _enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };
                
                // Create reset password link
                string resetLink = $"{_frontendUrl}/auth/reset-password?token={resetToken}&email={Uri.EscapeDataString(email)}";
                
                // Create email body with HTML
                string htmlBody = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ff7043; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }}
                        .reset-message {{ background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff7043; margin-bottom: 20px; }}
                        .important-note {{ background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px; }}
                        .button {{ display: inline-block; background-color: #ff7043; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #eee; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Réinitialisation de mot de passe</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour {userName},</p>
                            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte SimSoft.</p>
                            
                            <div class='reset-message'>
                                <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton ci-dessous.</p>
                            </div>
                            
                            <a href='{resetLink}' class='button'>Réinitialiser le mot de passe</a>
                            
                            <div class='important-note'>
                                <p><strong>Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email.</p>
                            </div>
                            
                            <div class='footer'>
                                <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                                <p>&copy; {DateTime.Now.Year} SimSoft. Tous droits réservés.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>";

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_smtpUser),
                    Subject = "SimSoft - Réinitialisation de mot de passe",
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                _logger.LogInformation($"Sending password reset email to {email}");
                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Password reset email sent successfully to {email}");
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError($"SMTP error sending password reset email to {email}: {smtpEx.Message}");
                throw new Exception($"Failed to send password reset email: {smtpEx.Message}", smtpEx);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error sending password reset email to {email}: {ex.Message}");
                throw new Exception("Failed to send password reset email due to an unexpected error", ex);
            }
        }
    }
}