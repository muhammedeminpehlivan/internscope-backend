using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("statistics")]
public class StatisticsController : ControllerBase
{
    private readonly StatisticsService _statisticsService;

    public StatisticsController(StatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("university")]
    public async Task<IActionResult> GetUniversityStats()
    {
        var stats = await _statisticsService.GetUniversityStatsAsync();
        return Ok(stats);
    }

    [HttpGet("department")]
    public async Task<IActionResult> GetDepartmentStats()
    {
        var stats = await _statisticsService.GetDepartmentStatsAsync();
        return Ok(stats);
    }

    [HttpGet("overall")]
    public async Task<IActionResult> GetOverall()
    {
        var stats = await _statisticsService.GetOverallAsync();
        return Ok(stats);
    }
}