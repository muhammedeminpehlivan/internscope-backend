using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

namespace InternScope.Extensions;

public static class AuthExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        // JWT anahtarı runtime'da null olursa startup'ta net hata verelim.
        var jwtKey = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
            throw new InvalidOperationException("Jwt:Key konfigürasyonu boş. appsettings veya user-secrets üzerinden set edin.");

        services.AddAuthentication(options =>
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
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)),
                RoleClaimType = "role"
            };
        })
        .AddOAuth("LinkedIn", options =>
        {
            options.SignInScheme = "Cookies";
            options.ClientId = configuration["LinkedIn:ClientId"];
            options.ClientSecret = configuration["LinkedIn:ClientSecret"];
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

        return services;
    }
}
