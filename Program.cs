using InternScope.Extensions;
using InternScope.Middleware;
using Microsoft.EntityFrameworkCore;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddApplicationServices();
builder.Services.AddSwaggerDocumentation();
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddCorsPolicy();
builder.Services.AddJwtAuthentication(builder.Configuration);

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
