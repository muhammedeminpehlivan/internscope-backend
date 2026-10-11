using FluentValidation;
using FluentValidation.AspNetCore;
using InternScope.Services;
using InternScope.Validators;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace InternScope.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(
                    new System.Text.Json.Serialization.JsonStringEnumConverter());
            });

        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<CommentInputValidator>();

        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

        // Brevo mail API'si için HttpClient (EmailService IHttpClientFactory kullanıyor)
        services.AddHttpClient();

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IInternshipService, InternshipService>();
        services.AddScoped<IUniversityService, UniversityService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddScoped<ICityService, CityService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IReactionService, ReactionService>();
        services.AddScoped<INewsService, NewsService>();
        services.AddScoped<INotificationService, NotificationService>();

        // Küfür listesini bir kez yükleyip bellekte tutar
        services.AddSingleton<IContentFilter, ContentFilter>();

        // Haberleri periyodik olarak RSS kaynaklarından çekip DB'ye cache'ler
        services.AddHostedService<NewsBackgroundService>();

        return services;
    }

    // Endpoint bazlı istek limitleri. Giriş yapmış kullanıcı kendi id'si üzerinden,
    // anonim istekler IP üzerinden sayılır. Sayaçlar bellekte: restart'ta sıfırlanır,
    // birden fazla instance'a ölçeklenirse Redis tabanlı bir çözüme geçmek gerekir.
    public static class RateLimitPolicies
    {
        public const string Comment = "comment";
        public const string CommentEdit = "comment-edit";
        public const string Report = "report";
        public const string Reaction = "reaction";
        public const string InternshipCreate = "internship-create";
        public const string InternshipEdit = "internship-edit";
        public const string VerificationEmail = "verification-email";
    }

    public static IServiceCollection AddRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, token) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Çok hızlı işlem yapıyorsunuz, lütfen biraz bekleyip tekrar deneyin." }, token);
            };

            AddFixedWindow(options, RateLimitPolicies.Comment, 5, TimeSpan.FromMinutes(1));
            AddFixedWindow(options, RateLimitPolicies.CommentEdit, 10, TimeSpan.FromMinutes(1));
            AddFixedWindow(options, RateLimitPolicies.Report, 10, TimeSpan.FromHours(1));
            AddFixedWindow(options, RateLimitPolicies.Reaction, 30, TimeSpan.FromMinutes(1));
            AddFixedWindow(options, RateLimitPolicies.InternshipCreate, 3, TimeSpan.FromHours(1));
            AddFixedWindow(options, RateLimitPolicies.InternshipEdit, 10, TimeSpan.FromHours(1));
            AddFixedWindow(options, RateLimitPolicies.VerificationEmail, 3, TimeSpan.FromMinutes(10));
        });

        return services;
    }

    private static void AddFixedWindow(RateLimiterOptions options, string policy, int permitLimit, TimeSpan window)
    {
        options.AddPolicy(policy, httpContext => RateLimitPartition.GetFixedWindowLimiter(
            GetPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueLimit = 0
            }));
    }

    // ApiControllerBase.GetUserId ile aynı claim'ler ("sub" veya NameIdentifier)
    private static string GetPartitionKey(HttpContext httpContext)
    {
        var userId = httpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value;

        return userId != null
            ? $"user:{userId}"
            : $"ip:{httpContext.Connection.RemoteIpAddress}";
    }

    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                // Npgsql'in non-deterministic collation annotation formatı, snapshot ile runtime model
                // karşılaştırmasında false-positive üretiyor. `dotnet ef migrations add` boş migration
                // üretiyorsa (yani gerçek diff yok) bu uyarı yanıltıcı — devre dışı bırakıyoruz.
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "InternScope API",
                Version = "v1"
            });

            // JWT desteği — sağ üstte "Authorize" butonu çıkar
            c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Description = "Token'ı buraya yapıştır (başına Bearer yazmana gerek yok)"
            });
            c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
