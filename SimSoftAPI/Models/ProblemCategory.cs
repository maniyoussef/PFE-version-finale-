using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
  public class ProblemCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int? ParentCategoryId { get; set; }

        [ForeignKey("ParentCategoryId")]
        public virtual ProblemCategory? ParentCategory { get; set; }
    }
