namespace SimSoftAPI.Models
{
   public class Role
{
    public Role()
    {
        Users = new HashSet<User>();
    }

    public int Id { get; set; }
    public required string Name { get; set; }
    public ICollection<User> Users { get; set; }
}
}
