using Microsoft.AspNetCore.Mvc;

namespace InternScope.Common;

// Result → IActionResult köprüsü. Controller'lar bu sayede if/else yazmadan
// sonucu doğru HTTP status'una çevirir.
public static class ResultExtensions
{
    // Değerli sonuç: başarılıysa 200 + değer, değilse hata status'u + mesaj.
    public static IActionResult ToActionResult<T>(this Result<T> result)
        => result.IsSuccess
            ? new OkObjectResult(result.Value)
            : result.Error!.ToActionResult();

    // Değersiz sonuç: başarılıysa 200 + verilen mesaj, değilse hata status'u.
    public static IActionResult ToActionResult(this Result result, string successMessage)
        => result.IsSuccess
            ? new OkObjectResult(new { message = successMessage })
            : result.Error!.ToActionResult();

    // Özel başarı gövdesi gereken yerler için (ör. Create → { id, message }):
    //   if (result.IsFailure) return result.Error!.ToActionResult();
    public static IActionResult ToActionResult(this Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status400BadRequest
        };

        return new ObjectResult(new { message = error.Message }) { StatusCode = statusCode };
    }
}
