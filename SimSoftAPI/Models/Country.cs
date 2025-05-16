// Models/Country.cs
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using SimSoftAPI.Models;

namespace SimSoftAPI.Models
{
  public class Country
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public ICollection<User> Users { get; set; } = new HashSet<User>();
}
}