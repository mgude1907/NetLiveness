using System.Threading.Tasks;
using NetLiveness.Api.Models;

namespace NetLiveness.Api.Services
{
    public interface IGlpiService
    {
        Task<string?> CreateTicketAsync(HelpRequest request);
        Task<(bool success, string message)> TestConnectionAsync(AppSettings? settings = null);
        Task<(bool success, int count, int matchedCount)> SyncInventoryAsync();
    }
}
