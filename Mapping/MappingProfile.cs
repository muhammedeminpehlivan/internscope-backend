using AutoMapper;
using InternScope.DTOs;
using InternScope.DTOs.Auth;
using InternScope.DTOs.Comment;
using InternScope.DTOs.Internship;
using InternScope.Entities;

namespace InternScope.Mapping;

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
            .ForMember(d => d.CityName, o => o.MapFrom(s => s.City.Name))
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company.Name))
            .ForMember(d => d.UniversityName, o => o.MapFrom(s => s.University.Name))
            .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.Name))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Term, o => o.MapFrom(s => s.Term.ToString()))
            .ForMember(d => d.Scores, o => o.MapFrom(s => s.Score))
            .ForMember(d => d.Interview, o => o.MapFrom(s => s.InterviewProcess))
            .ForMember(d => d.AuthorName,
                o => o.MapFrom(s => s.IsAnonymous ? "Anonim Kullanıcı" : s.User.FullName))
            .ForMember(d => d.AuthorProfilePictureUrl,
                o => o.MapFrom(s => s.IsAnonymous ? null : s.User.ProfilePictureUrl))
            .ForMember(d => d.AuthorLinkedInProfileUrl,
                o => o.MapFrom(s => s.IsAnonymous ? null : s.User.LinkedInProfileUrl));

        //University ve Department mapping
        CreateMap<University, UniversityOutputModel>();
        CreateMap<Department, DepartmentOutputModel>();

        //Admin için Internship mapping
        CreateMap<Internship, AdminInternshipOutputModel>()
    .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company.Name))
    .ForMember(d => d.UniversityName, o => o.MapFrom(s => s.University.Name))
    .ForMember(d => d.DepartmentName, o => o.MapFrom(s => s.Department.Name))
    .ForMember(d => d.RealAuthorName, o => o.MapFrom(s => s.User.FullName))
    .ForMember(d => d.AuthorEmail, o => o.MapFrom(s => s.User.Email))
    .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
    .ForMember(d => d.Term, o => o.MapFrom(s => s.Term.ToString()))
    .ForMember(d => d.Scores, o => o.MapFrom(s => s.Score))
    .ForMember(d => d.Interview, o => o.MapFrom(s => s.InterviewProcess));

        // City mapping
        CreateMap<City, CityOutputModel>();

        // Comment mapping — IsOwn runtime'da set edilir (requestingUserId bağlamsal)
        Guid requestingUserId = default;
        CreateMap<InternshipComment, CommentOutputModel>()
            .ForMember(d => d.AuthorName, o => o.MapFrom(s => s.User.FullName))
            .ForMember(d => d.AuthorProfilePictureUrl, o => o.MapFrom(s => s.User.ProfilePictureUrl))
            .ForMember(d => d.AuthorLinkedInProfileUrl, o => o.MapFrom(s => s.User.LinkedInProfileUrl))
            .ForMember(d => d.ReportCount, o => o.MapFrom(s => s.Reports.Count))
            .ForMember(d => d.IsOwn, o => o.MapFrom(s => s.UserId == requestingUserId));
    }
}