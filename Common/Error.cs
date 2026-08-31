namespace InternScope.Common;

// Hata "türü" — controller'ın doğru HTTP status'una çevirebilmesi için.
// Böylece "bulunamadı" 404, "iş kuralı" 400, "yetki yok" 403 döner; hepsi 400'e düşmez.
public enum ErrorType
{
    Validation, // 400 — iş kuralı / geçersiz istek
    NotFound,   // 404 — kayıt yok
    Conflict,   // 409 — çakışma (ör. zaten şikayet edilmiş)
    Forbidden   // 403 — yetki yok
}

public class Error
{
    public ErrorType Type { get; }
    public string Message { get; }

    private Error(ErrorType type, string message)
    {
        Type = type;
        Message = message;
    }

    public static Error Validation(string message) => new(ErrorType.Validation, message);
    public static Error NotFound(string message) => new(ErrorType.NotFound, message);
    public static Error Conflict(string message) => new(ErrorType.Conflict, message);
    public static Error Forbidden(string message) => new(ErrorType.Forbidden, message);
}
