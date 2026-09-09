using FluentValidation;
using FluentValidation.AspNetCore;
using InternScope.Services;
using InternScope.Validators;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

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

        // Haberleri periyodik olarak RSS kaynaklarından çekip DB'ye cache'ler
        services.AddHostedService<NewsBackgroundService>();

        return services;
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
