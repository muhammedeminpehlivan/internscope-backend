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
