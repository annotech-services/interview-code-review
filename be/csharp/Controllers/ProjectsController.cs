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
    public async Task<IActionResult> List()
    {
        using var conn = await _db.OpenAsync();
        var projects = await conn.QueryAsync<Project>(
            @"SELECT id, name, description, status, created_at
                FROM projects
               WHERE organization_id = @orgId
               ORDER BY created_at DESC",
            new { orgId = Caller.OrganizationId });
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
