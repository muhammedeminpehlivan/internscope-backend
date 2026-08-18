namespace InternScope.DTOs.Auth
{
    
        public class AuthInputModel
        {
            public string LinkedInId { get; set; }
            public string FullName { get; set; }
            public string Email { get; set; }
            public string? ProfilePictureUrl { get; set; }
        }

        public class AuthOutputModel
        {
            public string Token { get; set; }
            public string FullName { get; set; }
            public string Email { get; set; }
            public string? ProfilePictureUrl { get; set; }
            public bool IsEmailVerified { get; set; }
        }
    }


