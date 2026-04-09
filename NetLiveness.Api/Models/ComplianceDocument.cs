using System.ComponentModel.DataAnnotations;

namespace NetLiveness.Api.Models
{
    public class ComplianceDocument
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Standard { get; set; } = string.Empty; // ISO27001, NIST, FACILITY, etc.
        
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;
        
        public DateTime UploadDate { get; set; } = DateTime.Now;
        
        public string? Description { get; set; }
    }
}
