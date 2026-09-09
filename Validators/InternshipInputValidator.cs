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

        // Puanlar: kullanıcı hepsini seçmek zorunda, her biri 1-5 aralığında.
        When(x => x.Scores != null, () =>
        {
            RuleFor(x => x.Scores.LearningScore).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(1, 5).WithMessage("Öğrenme puanı 1-5 arası seçilmelidir.");
            RuleFor(x => x.Scores.MentoringScore).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(1, 5).WithMessage("Mentorluk puanı 1-5 arası seçilmelidir.");
            RuleFor(x => x.Scores.TechInfraScore).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(1, 5).WithMessage("Teknik altyapı puanı 1-5 arası seçilmelidir.");
            RuleFor(x => x.Scores.WorkEnvironmentScore).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(1, 5).WithMessage("Çalışma ortamı puanı 1-5 arası seçilmelidir.");
            RuleFor(x => x.Scores.SalaryScore).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(1, 5).WithMessage("Maaş puanı 1-5 arası seçilmelidir.");
            RuleFor(x => x.Scores.WouldRecommend)
                .NotNull().WithMessage("Tavsiye eder misiniz sorusu yanıtlanmalıdır.");
            RuleFor(x => x.Scores.AdditionalTips)
                .MaximumLength(1000).WithMessage("İpuçları en fazla 1000 karakter olabilir.");
        });

        // Mülakat: başvuru yöntemi seçilmeli, aşama sayısı verilmeli.
        When(x => x.Interview != null, () =>
        {
            RuleFor(x => x.Interview.ApplicationMethod).Cascade(CascadeMode.Stop)
                .NotNull().IsInEnum().WithMessage("Geçerli bir başvuru yöntemi seçilmelidir.");
            RuleFor(x => x.Interview.StageCount).Cascade(CascadeMode.Stop)
                .NotNull().InclusiveBetween(0, 20).WithMessage("Mülakat aşama sayısı 0-20 arası olmalıdır.");
            RuleFor(x => x.Interview.Description)
                .MaximumLength(2000).WithMessage("Mülakat açıklaması en fazla 2000 karakter olabilir.");
        });
    }
}
