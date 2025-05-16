using System.Collections.Generic;

namespace SimSoftAPI.Models
{
public class AuthResponseDto
{
    public string Token { get; set; }
    public UserDto User { get; set; }
}

public class UserDto
{
    public string Id { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }
}
}