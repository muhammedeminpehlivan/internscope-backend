using FluentValidation;
using FluentValidation.AspNetCore;
using InternScope.Middleware;
using InternScope.Services;
using InternScope.Validators;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CommentInputValidator>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
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
// JWT anahtarı runtime'da null olursa startup'ta net hata verelim.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key konfigürasyonu boş. appsettings veya user-secrets üzerinden set edin.");

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<CompanyService>();
builder.Services.AddScoped<InternshipService>();
builder.Services.AddScoped<UniversityService>();
builder.Services.AddScoped<DepartmentService>();
builder.Services.AddScoped<StatisticsService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<CloudinaryService>();
builder.Services.AddScoped<CityService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<ReactionService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        // Npgsql'in non-deterministic collation annotation formatı, snapshot ile runtime model
        // karşılaştırmasında false-positive üretiyor. `dotnet ef migrations add` boş migration
        // üretiyorsa (yani gerçek diff yok) bu uyarı yanıltıcı — devre dışı bırakıyoruz.
        .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Authentication
builder.Services.AddAuthentication(options =>
{
options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})

.AddCookie("Cookies", options =>
{
options.Cookie.SameSite = SameSiteMode.Lax;
options.Cookie.SecurePolicy = CookieSecurePolicy.None;
options.Cookie.HttpOnly = true;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters

    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = "role"
    };
})

// ...
.AddOAuth("LinkedIn", options =>
{
    options.SignInScheme = "Cookies";
    options.ClientId = builder.Configuration["LinkedIn:ClientId"];
    options.ClientSecret = builder.Configuration["LinkedIn:ClientSecret"];
    options.CallbackPath = "/auth/linkedin/callback";
    options.SaveTokens = true;

    options.AuthorizationEndpoint = "https://www.linkedin.com/oauth/v2/authorization";
    options.TokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";
    options.UserInformationEndpoint = "https://api.linkedin.com/v2/userinfo";

    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    options.ClaimActions.MapJsonKey("sub", "sub");
    options.ClaimActions.MapJsonKey("name", "name");
    options.ClaimActions.MapJsonKey("email", "email");
    options.ClaimActions.MapJsonKey("picture", "picture");

    options.Events.OnCreatingTicket = async context =>
    {
        var request = new HttpRequestMessage(HttpMethod.Get, context.Options.UserInformationEndpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", context.AccessToken);
        var response = await context.Backchannel.SendAsync(request);
        var user = await response.Content.ReadFromJsonAsync<JsonElement>();
        context.RunClaimActions(user);
    };
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Boş DB'ye deploy'da tabloları oluştur, sonra seed'i çalıştır.
    context.Database.Migrate();
    DbInitializer.SeedUniversities(context);
    DbInitializer.SeedCities(context);
    DbInitializer.SeedDepartments(context);
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
        | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionHandlingMiddleware>();




app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "InternScope API v1");
    });


app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Lax,
    Secure = CookieSecurePolicy.SameAsRequest
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();