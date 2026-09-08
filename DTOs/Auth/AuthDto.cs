namespace InternScope.DTOs.Auth
{
    public class AuthInputModel
    {
        public required string LinkedInId { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

    public class AuthOutputModel
    {
        public string Token { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? ProfilePictureUrl { get; set; }
        public bool IsEmailVerified { get; set; }
    }
}
