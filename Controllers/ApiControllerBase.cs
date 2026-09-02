using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// Tüm controller'lar için ortak taban. Kullanıcı kimliğini claim'lerden
// okuma mantığını tek yerde toplar; her controller'da tekrar edilmesini önler.
namespace InternScope.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    // Doğrulanmış isteklerde kullanıcının Guid'i. "sub" (JWT) veya
    // NameIdentifier (cookie/OAuth) claim'inden okunur.
    protected Guid GetUserId() => Guid.Parse(
        User.Claims.First(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier).Value);

    // AllowAnonymous endpoint'ler için: giriş yapılmışsa kullanıcı Guid'i,
    // yoksa null.
    protected Guid? GetUserIdOrNull() =>
        User.Identity?.IsAuthenticated == true ? GetUserId() : null;
}
