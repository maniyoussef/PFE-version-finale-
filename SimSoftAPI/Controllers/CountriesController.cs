using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimSoftAPI.Data;
using SimSoftAPI.Models;
using System.Text.Json;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Threading.Tasks;
using System.Linq;

namespace SimSoftAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CountriesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CountriesController> _logger;
        private readonly HttpClient _httpClient;
        private const string REST_COUNTRIES_API = "https://restcountries.com/v3.1/all?fields=name,cca2";

        public CountriesController(AppDbContext context, ILogger<CountriesController> logger, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        // GET: api/countries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Country>>> GetCountries()
        {
            var countries = await _context.Countries.ToListAsync();
            return Ok(countries);
        }

        // GET: api/countries/available
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<Country>>> GetAvailableCountries()
        {
            try
            {
                var existingCodes = await _context.Countries
                    .Select(c => c.Code.ToLower())
                    .ToListAsync();

                var allCountries = await GetAllCountriesFromAPI();

                if (allCountries is null)
                {
                    return StatusCode(500, "Erreur lors de la récupération des pays depuis l'API.");
                }

                var availableCountries = allCountries
                    .Where(c => !existingCodes.Contains(c.Code.ToLower()))
                    .ToList();

                return Ok(availableCountries);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de la récupération des pays disponibles : {ex.Message}");
                return StatusCode(500, "Erreur lors de la récupération des pays.");
            }
        }

        // POST: api/countries
        [HttpPost]
        public async Task<ActionResult<Country>> AddCountry([FromBody] Country country)
        {
            if (country == null || string.IsNullOrEmpty(country.Code) || string.IsNullOrEmpty(country.Name))
            {
                return BadRequest("Le pays et son code ne peuvent pas être vides.");
            }

            try
            {
                if (await _context.Countries.AnyAsync(c => c.Code.ToLower() == country.Code.ToLower()))
                {
                    return Conflict($"Le pays avec le code {country.Code} existe déjà.");
                }

                country.Code = country.Code.ToLower();
                country.Icon = $"https://flagcdn.com/48x36/{country.Code}.png";

                _context.Countries.Add(country);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCountries), new { id = country.Id }, country);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de l'ajout du pays : {ex.Message}");
                return StatusCode(500, "Erreur lors de l'ajout du pays en base de données.");
            }
        }

        // DELETE: api/countries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCountry(int id)
        {
            var country = await _context.Countries.FindAsync(id);
            if (country is null)
            {
                return NotFound("Pays non trouvé.");
            }

            _context.Countries.Remove(country);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<List<Country>?> GetAllCountriesFromAPI()
        {
            try
            {
                var response = await _httpClient.GetAsync(REST_COUNTRIES_API);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Échec de l'appel API, statut : {response.StatusCode}");
                    return null;
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var countriesData = JsonSerializer.Deserialize<JsonElement[]>(responseBody);
                
                if (countriesData is null)
                {
                    _logger.LogError("La désérialisation des données de pays a échoué");
                    return null;
                }

                var countries = new List<Country>();

                foreach (var countryData in countriesData)
                {
                    if (countryData.TryGetProperty("name", out var nameProperty) &&
                        nameProperty.TryGetProperty("common", out var commonNameProperty) &&
                        commonNameProperty.GetString() is string name &&
                        countryData.TryGetProperty("cca2", out var cca2Property) &&
                        cca2Property.GetString() is string code)
                    {
                        countries.Add(new Country
                        {
                            Name = name,
                            Code = code.ToLower(),
                            Icon = $"https://flagcdn.com/48x36/{code.ToLower()}.png"
                        });
                    }
                }

                return countries;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de la récupération des pays depuis l'API : {ex.Message}");
                return null;
            }
        }
    }
}