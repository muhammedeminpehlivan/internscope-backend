using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[ApiController]
[Route("department")]
public class DepartmentController : ControllerBase
{
    private readonly DepartmentService _departmentService;

    public DepartmentController(DepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _departmentService.GetAllAsync();
        return Ok(list);
    }
}