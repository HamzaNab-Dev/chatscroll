using ChatScroll.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly ChatScrollDbContext _db;

    public StatsController(ChatScrollDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Public endpoint — no user isolation. Returns live global counts from Aurora for the landing page.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetGlobalStats()
    {
        var totalScrolls = await _db.Notes.CountAsync();
        var totalUsers = await _db.Users.CountAsync();
        return Ok(new { totalScrolls, totalUsers });
    }
}
