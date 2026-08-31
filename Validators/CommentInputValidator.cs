using FluentValidation;
using InternScope.DTOs.Comment;

namespace InternScope.Validators
{
    public class CommentInputValidator : AbstractValidator<CommentInputModel>
    {
        public CommentInputValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Yorum boş olamaz.")
                .MaximumLength(1000).WithMessage("Yorum en fazla 1000 karakter olabilir.");
        }
    }
}
