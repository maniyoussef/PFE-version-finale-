using System;
using System.Text;

namespace SimSoftAPI.Services // Ajout d'un namespace pour éviter les conflits
{
   public class PasswordGeneratorService : IPasswordGeneratorService
{
    private string _lastGeneratedPassword = string.Empty;
    
    public string LastGeneratedPassword => _lastGeneratedPassword;

    public string GeneratePassword()
    {
        // Génération du mot de passe
        _lastGeneratedPassword = GenerateRandomPassword();
        return _lastGeneratedPassword;
    }

    private string GenerateRandomPassword()
    {
        // Votre logique de génération ici
        return Guid.NewGuid().ToString("N")[..8]; // Exemple
    }
}}