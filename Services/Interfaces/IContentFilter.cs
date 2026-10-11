namespace InternScope.Services;

public interface IContentFilter
{
    // Kullanıcı metnini temizler: küfürleri *** ile sansürler, aynı karakterin
    // uzun tekrarlarını kısaltır; removeLinks=true ise http/www linklerini kaldırır.
    string Sanitize(string text, bool removeLinks = false);
}
