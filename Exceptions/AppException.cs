namespace InternScope.Exceptions;

/// <summary>
/// Beklenen iş kuralı ihlalleri için kullanılır.
/// Middleware tarafından 400 BadRequest olarak dönülür.
/// </summary>
public class AppException : Exception
{
    public AppException(string message) : base(message) { }
}
