using Microsoft.Extensions.DependencyInjection;
using SimSoftAPI.Services;

namespace SimSoftAPI
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // ... existing service registrations ...

            // Add NotificationService
            services.AddScoped<INotificationService, NotificationService>();

            // ... rest of the method ...
        }
    }
} 