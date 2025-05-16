using Microsoft.AspNetCore.Mvc;
using SimSoftAPI.Models;
using SimSoftAPI.Services;
using SimSoftAPI.Data;
using SimSoftAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace SimSoftAPI.Controllers
{
    [Route("api/problem-categories")]
    [ApiController]
    public class ProblemCategoryController : ControllerBase
    {
        private readonly ProblemCategoryService _service;
        private readonly AppDbContext _context;

        public ProblemCategoryController(ProblemCategoryService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var categories = await _service.GetAllAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAll: {ex.Message}");
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] ProblemCategory category)
        {
            if (category == null)
            {
                return BadRequest("Category data is null");
            }

            try
            {
                var createdCategory = await _service.CreateAsync(category);
                return CreatedAtAction(nameof(GetAll), new { id = createdCategory.Id }, createdCategory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }
        
        [HttpGet("qualifications")]
        public async Task<IActionResult> GetQualifications()
        {
            var qualifications = await _service.GetAllAsync();
            return Ok(qualifications);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _service.DeleteAsync(id);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Delete: {ex.Message}");
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }
        
        [HttpPost("assign-to-client")]
        public async Task<IActionResult> AssignToClient([FromBody] AssignProblemCategoryToClientDto dto)
        {
            try
            {
                Console.WriteLine($"Assigning problem category {dto.ProblemCategoryId} to client {dto.ClientId}");
                
                // Find the client user and problem category independently
                var client = await _context.Users.FindAsync(dto.ClientId);
                if (client == null)
                    return NotFound(new { success = false, message = "Client not found" });
                    
                var category = await _context.ProblemCategories.FindAsync(dto.ProblemCategoryId);
                if (category == null)
                    return NotFound(new { success = false, message = "Problem category not found" });
                
                // Check if assignment already exists to avoid duplicates
                var existingAssignment = await _context.ClientProblemCategories
                    .FirstOrDefaultAsync(cpc => 
                        cpc.ClientId == dto.ClientId && 
                        cpc.ProblemCategoryId == dto.ProblemCategoryId);
                        
                if (existingAssignment != null)
                {
                    Console.WriteLine($"Assignment already exists for client {dto.ClientId} and category {dto.ProblemCategoryId}");
                    return Ok(new { 
                        success = true, 
                        message = $"Problem category {category.Name} is already assigned to client {client.Name}",
                        alreadyAssigned = true
                    });
                }
                
                // Create a ClientProblemCategory entry in the database
                var clientProblemCategory = new ClientProblemCategory
                {
                    ClientId = dto.ClientId,
                    ProblemCategoryId = dto.ProblemCategoryId,
                    AssignedDate = DateTime.UtcNow
                };
                
                _context.ClientProblemCategories.Add(clientProblemCategory);
                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    success = true, 
                    message = $"Problem category {category.Name} assigned to client {client.Name}",
                    category = new {
                        id = category.Id,
                        name = category.Name
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error assigning problem category to client: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Internal Server Error: {ex.Message}" });
            }
        }
        
        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetClientCategories(int clientId)
        {
            try
            {
                Console.WriteLine($"Getting problem categories for client {clientId}");
                
                var client = await _context.Users.FindAsync(clientId);
                if (client == null)
                    return NotFound(new { success = false, message = "Client not found" });
                
                // Get problem categories through the ClientProblemCategory table
                var categories = await _context.ClientProblemCategories
                    .Where(cpc => cpc.ClientId == clientId)
                    .Include(cpc => cpc.ProblemCategory)
                    .Select(cpc => cpc.ProblemCategory)
                    .ToListAsync();
                
                Console.WriteLine($"Found {categories.Count} problem categories for client {clientId}");
                
                // Return with a proper structure
                return Ok(categories.Select(c => new {
                    id = c.Id,
                    name = c.Name,
                    description = c.Description
                }).ToList());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving client problem categories: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Internal Server Error: {ex.Message}" });
            }
        }
        
        [HttpDelete("{categoryId}/client/{clientId}")]
        public async Task<IActionResult> RemoveFromClient(int categoryId, int clientId)
        {
            try
            {
                Console.WriteLine($"Removing problem category {categoryId} from client {clientId}");
                
                // Find the client user and problem category independently
                var client = await _context.Users.FindAsync(clientId);
                if (client == null)
                    return NotFound(new { success = false, message = "Client not found" });
                    
                var category = await _context.ProblemCategories.FindAsync(categoryId);
                if (category == null)
                    return NotFound(new { success = false, message = "Problem category not found" });
                
                // Find the assignment to remove
                var assignment = await _context.ClientProblemCategories
                    .FirstOrDefaultAsync(cpc => 
                        cpc.ClientId == clientId && 
                        cpc.ProblemCategoryId == categoryId);
                        
                if (assignment == null)
                {
                    Console.WriteLine($"Assignment does not exist for client {clientId} and category {categoryId}");
                    return NotFound(new { 
                        success = false, 
                        message = $"Problem category {category.Name} is not assigned to client {client.Name}"
                    });
                }
                
                // Remove the ClientProblemCategory entry from the database
                _context.ClientProblemCategories.Remove(assignment);
                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    success = true, 
                    message = $"Problem category {category.Name} removed from client {client.Name}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing problem category from client: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Internal Server Error: {ex.Message}" });
            }
        }
    }
}
