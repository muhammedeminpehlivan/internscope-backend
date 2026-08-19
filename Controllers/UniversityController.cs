using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("university")]
public class UniversityController : ControllerBase
{
    private readonly UniversityService _universityService;

    public UniversityController(UniversityService universityService)
    {
        _universityService = universityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _universityService.GetAllAsync();
        return Ok(list);
    }
}