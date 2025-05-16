using System.Collections.Generic;
using System.Threading.Tasks;
using SimSoftAPI.Models;

namespace SimSoftAPI.Services
{
    public interface ITicketService
    {
        Task<List<Ticket>> GetUserTicketsAsync(int userId);
        Task<List<Ticket>> GetTicketsAsync();
        Task<Ticket> CreateTicketAsync(Ticket ticket);
        // Add other methods that are already in the TicketService class
    }
} 