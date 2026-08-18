using AutoMapper;
using InternScope.DTOs.Auth;
using InternScope.DTOs.Internship;
using InternScope.Entities;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User -> AuthOutputModel
        CreateMap<User, AuthOutputModel>();

        // ---- Internship kayıt (Input -> Entity) ----
        CreateMap<ScoreInputModel, InternshipScore>();
        CreateMap<InterviewInputModel, InterviewProcess>();

        // ---- Internship gösterim (Entity -> Output) ----
        CreateMap<InternshipScore, ScoreOutputModel>();
        CreateMap<InterviewProcess, InterviewOutputModel>();

        CreateMap<Internship, InternshipOutputModel>()
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company.Name))
            .ForMember(d => d.UniversityName, o => o.MapFrom(s => s.University.Name))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.Name))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Scores, o => o.MapFrom(s => s.Score))
            .ForMember(d => d.Interview, o => o.MapFrom(s => s.InterviewProcess))
            .ForMember(d => d.AuthorName,
                o => o.MapFrom(s => s.IsAnonymous ? "Anonim Kullanıcı" : s.User.FullName));
    }
}