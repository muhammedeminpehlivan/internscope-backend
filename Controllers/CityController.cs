using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("city")]
public class CityController : ControllerBase
{
    private readonly CityService _cityService;

    public CityController(CityService cityService)
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
