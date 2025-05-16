using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System.Text.Json;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CompaniesController> _logger;

        public CompaniesController(AppDbContext context, ILogger<CompaniesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
        {
            try
            {
                var companies = await _context.Companies.ToListAsync();
                _logger.LogInformation($"Retrieved {companies.Count} companies");
                return Ok(companies);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving companies: {ex.Message}");
                return StatusCode(500, $"Internal server error while retrieving companies: {ex.Message}");
            }
        }

       [HttpPost]
public IActionResult AddCompany([FromBody] Company company)
{
    if (!ModelState.IsValid)
    {
        // Log detailed validation errors
        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage);
        
        _logger.LogError("Validation failed. Errors: {Errors}", string.Join(", ", errors));
        
        return BadRequest(new {
            Message = "Validation failed",
            Errors = errors
        });
    }

    try
    {
        _context.Companies.Add(company);
        _context.SaveChanges();
        return CreatedAtAction(nameof(GetCompanies), new { id = company.Id }, company);
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error creating company: {ex.Message}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
    }
}


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            try
            {
                var company = await _context.Companies.FindAsync(id);
                if (company == null)
                {
                    _logger.LogWarning($"Delete company failed: Company with ID {id} not found");
                    return NotFound($"Company with ID {id} not found");
                }

                _context.Companies.Remove(company);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Successfully deleted company with ID: {id}");
                return NoContent();
            }
            catch (DbUpdateException dbEx)
            {
                if (dbEx.InnerException?.Message.Contains("foreign key constraint") == true)
                {
                    _logger.LogWarning($"Cannot delete company {id}: it is referenced by other records");
                    return BadRequest($"Cannot delete company: it is referenced by projects or other records. Delete those records first.");
                }
                
                _logger.LogError($"Database error deleting company: {dbEx.InnerException?.Message ?? dbEx.Message}");
                return StatusCode(500, $"Database error while deleting company: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting company: {ex.Message}");
                return StatusCode(500, $"Internal server error while deleting company: {ex.Message}");
            }
        }
        
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
