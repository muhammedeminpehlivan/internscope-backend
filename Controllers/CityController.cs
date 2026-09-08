using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[ApiController]
[Route("city")]
public class CityController : ControllerBase
{
    private readonly ICityService _cityService;

    public CityController(ICityService cityService)
    {
        _cityService = cityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _cityService.GetAllAsync();
        return Ok(list);
    }
}
