public class AssignProjectDto
{
    public int ChefProjetId { get; set; }
    public List<int> CollaborateurIds { get; set; } = new List<int>();
}