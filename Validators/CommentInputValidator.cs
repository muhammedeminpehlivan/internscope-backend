using FluentValidation;
using InternScope.DTOs.Comment;

namespace InternScope.Validators;

public class CommentInputValidator : AbstractValidator<CommentInputModel>
{
    public CommentInputValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Yorum boş olamaz.")
            .MaximumLength(500).WithMessage("Yorum en fazla 500 karakter olabilir.");
    }
}

public class ReportInputValidator : AbstractValidator<ReportInputModel>
{
    public ReportInputValidator()
    {
        RuleFor(x => x.Reason)
            .IsInEnum().WithMessage("Geçerli bir şikayet sebebi seçilmelidir.");

        RuleFor(x => x.Note)
            .MaximumLength(300).WithMessage("Açıklama en fazla 300 karakter olabilir.");
    }
}
