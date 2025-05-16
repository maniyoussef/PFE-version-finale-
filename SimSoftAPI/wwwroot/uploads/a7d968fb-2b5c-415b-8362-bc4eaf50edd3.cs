using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SimSoftAPI.Data;
using SimSoftAPI.DTOs;
using SimSoftAPI.Models;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TicketsController> _logger;
        private readonly IWebHostEnvironment _environment;

        public TicketsController(AppDbContext context, ILogger<TicketsController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetAllTickets()
        {
            _logger.LogInformation("GetAllTickets endpoint called");

            try
            {
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .ToListAsync();

                _logger.LogInformation($"Found {tickets.Count} tickets");

                if (!tickets.Any())
                {
                    _logger.LogWarning("No tickets found in database");
                }

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching tickets");
                return StatusCode(500, "Internal server error while retrieving tickets");
            }
        }

        [HttpGet("mes-tickets")]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetMesTickets()
        {
            try
            {
                var tickets = await _context.Tickets
                    .Include(t => t.Project)
                    .Include(t => t.ProblemCategory)
                    .Include(t => t.AssignedTo)
                    .OrderByDescending(t => t.CreatedDate)
                    .AsSplitQuery()
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetMesTickets");
                return StatusCode(500, "Internal server error");
            }
        }

[HttpPost("upload")]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    if (file == null || file.Length == 0)
    {
        _logger.LogWarning("Upload attempted with null or empty file");
        return BadRequest(new { message = "No file selected or file is empty." });
    }

    try
    {
        // Ensure wwwroot exists
        if (!Directory.Exists(_environment.WebRootPath))
        {
            Directory.CreateDirectory(_environment.WebRootPath);
        }

        // Create uploads directory
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Validate file size (e.g., 10MB max)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size exceeds maximum limit of 10MB" });
        }

        // Create unique filename
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _logger.LogInformation($"File successfully uploaded: {uniqueFileName}");
        return Ok(new { path = $"/uploads/{uniqueFileName}" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during file upload");
        return StatusCode(500, new { message = "Internal server error during file upload", details = ex.Message });
    }
}
       [HttpPost]
public async Task<ActionResult<Ticket>> CreateTicket([FromBody] TicketDto ticketDto)
{
    _logger.LogInformation("CreateTicket endpoint called with CategoryId: {CategoryId}", ticketDto.ProblemCategoryId);

    try
    {
        // Verify the category exists
        var categoryExists = await _context.ProblemCategories.AnyAsync(c => c.Id == ticketDto.ProblemCategoryId);
        if (!categoryExists)
        {
            return BadRequest($"Problem category with ID {ticketDto.ProblemCategoryId} does not exist");
        }

        var ticket = new Ticket
        {
            Title = ticketDto.Title,
            Description = ticketDto.Description,
            Qualification = ticketDto.Qualification,
            ProjectId = ticketDto.ProjectId,
            ProblemCategoryId = ticketDto.ProblemCategoryId,
            Priority = ticketDto.Priority,
            Status = "Open",
            CreatedDate = DateTime.UtcNow,
            AssignedToId = ticketDto.AssignedToId ?? 1,
            Attachment = ticketDto.Attachment
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Explicitly load the related entities
        var createdTicket = await _context.Tickets
            .Include(t => t.Project)
            .Include(t => t.ProblemCategory)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id);

        return CreatedAtAction(nameof(GetAllTickets), new { id = ticket.Id }, createdTicket);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating ticket");
        return StatusCode(500, "Internal server error while creating ticket");
    }
}
        }
    }
