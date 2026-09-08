using FluentValidation;
using InternScope.DTOs.Internship;

namespace InternScope.Validators;

public class InternshipInputValidator : AbstractValidator<InternshipInputModel>
{
    public InternshipInputValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Şirket adı boş olamaz.")
            .MaximumLength(200).WithMessage("Şirket adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.CompanyDepartment)
            .NotEmpty().WithMessage("Şirket departmanı boş olamaz.")
            .MaximumLength(200).WithMessage("Departman adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.UniversityId)
            .NotEmpty().WithMessage("Üniversite seçilmelidir.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Bölüm seçilmelidir.");

        RuleFor(x => x.CityId)
            .NotEmpty().WithMessage("Şehir seçilmelidir.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Başlangıç tarihi boş olamaz.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Bitiş tarihi boş olamaz.")
            .GreaterThan(x => x.StartDate).WithMessage("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

        RuleFor(x => x.StipendMin)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum ücret negatif olamaz.")
            .When(x => x.StipendMin.HasValue);

        RuleFor(x => x.StipendMax)
            .GreaterThanOrEqualTo(0).WithMessage("Maksimum ücret negatif olamaz.")
            .GreaterThanOrEqualTo(x => x.StipendMin!.Value).WithMessage("Maksimum ücret minimumdan az olamaz.")
            .When(x => x.StipendMax.HasValue && x.StipendMin.HasValue);

        RuleFor(x => x.Scores).NotNull().WithMessage("Puanlama bilgileri zorunludur.");
        RuleFor(x => x.Interview).NotNull().WithMessage("Mülakat bilgileri zorunludur.");
    }
}
