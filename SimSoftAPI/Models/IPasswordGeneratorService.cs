public interface IPasswordGeneratorService
{
    string GeneratePassword();
        string LastGeneratedPassword { get; } // Ajouter cette propriété

}
