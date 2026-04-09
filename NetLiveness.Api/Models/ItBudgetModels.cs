namespace NetLiveness.Api.Models
{
    public class ItBudgetCategory
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OrderIndex { get; set; }

        public ICollection<ItBudgetItem> Items { get; set; } = new List<ItBudgetItem>();
    }

    public class ItBudgetItem
    {
        public int Id { get; set; }
        
        public int CategoryId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public ItBudgetCategory? Category { get; set; }

        public string Name { get; set; } = string.Empty;

        // Monthly values
        public decimal Jan { get; set; }
        public decimal Feb { get; set; }
        public decimal Mar { get; set; }
        public decimal Apr { get; set; }
        public decimal May { get; set; }
        public decimal Jun { get; set; }
        public decimal Jul { get; set; }
        public decimal Aug { get; set; }
        public decimal Sep { get; set; }
        public decimal Oct { get; set; }
        public decimal Nov { get; set; }
        public decimal Dec { get; set; }
    }
}
