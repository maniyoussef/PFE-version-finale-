using SimSoftAPI.Models;
using SimSoftAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace SimSoftAPI.Services
{
    public class ProblemCategoryService
    {
        private readonly AppDbContext _context;

        public ProblemCategoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProblemCategory>> GetAllAsync()
        {
            return await _context.ProblemCategories.ToListAsync();
        }

        public async Task<ProblemCategory?> GetByIdAsync(int id)
        {
            return await _context.ProblemCategories.FindAsync(id);
        }

        public async Task<ProblemCategory> CreateAsync(ProblemCategory category)
        {
            _context.ProblemCategories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<ProblemCategory?> UpdateAsync(int id, ProblemCategory updatedCategory)
        {
            var category = await _context.ProblemCategories.FindAsync(id);
            if (category == null) return null;

            category.Name = updatedCategory.Name;
            category.Description = updatedCategory.Description; // ✅ Fixed Description reference

            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _context.ProblemCategories.FindAsync(id);
            if (category == null) return false;

            _context.ProblemCategories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
