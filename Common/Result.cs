namespace InternScope.Common;

// Değer döndürmeyen işlemler için (sil, onayla, reddet...)
public class Result
{
    public bool IsSuccess { get; }
    public Error? Error { get; }
    public bool IsFailure => !IsSuccess;

    protected Result(bool isSuccess, Error? error)
    {
        // Tutarsız durumları (başarılı ama hatalı / başarısız ama hatasız) baştan engelle.
        if (isSuccess && error != null)
            throw new InvalidOperationException("Başarılı sonucun hatası olamaz.");
        if (!isSuccess && error == null)
            throw new InvalidOperationException("Başarısız sonucun hatası olmalı.");

        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(Error error) => new(false, error);

    // Error → Result kısayolu: metotta `return Error.NotFound(...)` yazılabilsin diye.
    public static implicit operator Result(Error error) => Failure(error);
}

// Değer döndüren işlemler için (oluştur → Guid, profil → User...)
public class Result<T> : Result
{
    public T? Value { get; }

    private Result(bool isSuccess, T? value, Error? error) : base(isSuccess, error)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static new Result<T> Failure(Error error) => new(false, default, error);

    // `return user;` ve `return Error.NotFound(...)` ikisi de çalışsın diye implicit dönüşümler.
    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}
