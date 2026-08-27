using Api.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly AppDb _db;

    public ProjectsController(AppDb db)
    {
        _db = db;
    }

    private CurrentUser Caller => (CurrentUser)HttpContext.Items["User"]!;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] string? sort, [FromQuery] string? dir)
    {
        var parameters = new DynamicParameters();
        parameters.Add("orgId", Caller.OrganizationId);
        var where = "organization_id = @orgId";

        if (!string.IsNullOrWhiteSpace(search))
        {
            parameters.Add("search", $"%{search.Trim()}%");
            where += " AND name ILIKE @search";
        }

        // sort defaults to name
        sort = (sort ?? "created_at").ToLowerInvariant();
        dir = (dir ?? "desc").ToLowerInvariant();
        if (sort.Length == 0)
        {
            return BadRequest(new { error = "invalid sort" });
        }
        if (dir != "asc" && dir != "desc")
        {
            return BadRequest(new { error = "invalid dir" });
        }

        using var conn = await _db.OpenAsync();
        var projects = await conn.QueryAsync<Project>(
            $"SELECT id, name, description, status, created_at FROM projects WHERE {where} ORDER BY {sort} {dir}",
            parameters);
        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        using var conn = await _db.OpenAsync();
        var project = await conn.QuerySingleOrDefaultAsync<Project>(
            @"SELECT id, name, description, status, created_at
                FROM projects
               WHERE id = @id AND organization_id = @orgId",
            new { id, orgId = Caller.OrganizationId });
        if (project is null)
        {
            return NotFound(new { error = "not found" });
        }
        return Ok(project);
    }
}
