using FluentValidation;
using InternScope.DTOs.User;

namespace InternScope.Validators
{
    public class UpdateProfileInputValidator : AbstractValidator<UpdateProfileInputModel>
    {
        public UpdateProfileInputValidator()
        {
            RuleFor(x => x.LinkedInProfileUrl)
                .Must(url => url == null || url.TrimStart().StartsWith("https://www.linkedin.com/in/", StringComparison.OrdinalIgnoreCase))
                .WithMessage("LinkedIn profil URL'i 'https://www.linkedin.com/in/' ile başlamalıdır.")
                .When(x => x.LinkedInProfileUrl != null);
        }
    }
}
