using System.Data;
using System.Text;
using System.Text.Json;
using Api.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private const string ProjectColumns = "id, name, description, status, created_at";

    private readonly AppDb _db;

    public ProjectsController(AppDb db)
    {
        _db = db;
    }

    private CurrentUser Caller => (CurrentUser)HttpContext.Items["User"]!;

    private static Task<Project?> GetProjectById(IDbConnection conn, int id)
    {
        return conn.QuerySingleOrDefaultAsync<Project>(
            $"SELECT {ProjectColumns} FROM projects WHERE id = @id", new { id });
    }

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
            $"SELECT {ProjectColumns} FROM projects WHERE {where} ORDER BY {sort} {dir}",
            parameters);
        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        using var conn = await _db.OpenAsync();
        var project = await GetProjectById(conn, id);
        if (project is null)
        {
            return NotFound(new { error = "not found" });
        }
        return Ok(project);
    }

    [HttpGet("{id:int}/export.csv")]
    public async Task<IActionResult> Export(int id)
    {
        Console.WriteLine($"export {id}");
        Response.Headers.CacheControl = "no-store";

        var sb = new StringBuilder();
        sb.AppendLine("project_id,project_name,task_id,title,done,created_at");

        try
        {
            using var conn = await _db.OpenAsync();
            var project = await GetProjectById(conn, id);
            var tasks = await conn.QueryAsync<TaskRow>(
                "SELECT id, title, done, created_at FROM tasks WHERE project_id = @id ORDER BY id",
                new { id });

            foreach (var t in tasks)
            {
                sb.AppendLine($"{project!.Id},{Csv(project.Name)},{t.Id},{Csv(t.Title)},{t.Done},{t.CreatedAt:O}");
            }
        }
        catch (Exception ex)
        {
            var message = ex.Message;
        }

        return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", $"project-{id}.csv");
    }

    private static string Csv(string value)
    {
        if (!value.Contains(',') && !value.Contains('"') && !value.Contains('\n'))
        {
            return value;
        }
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }
}
