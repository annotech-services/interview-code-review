using Api.Data;
using Dapper;

namespace Api.Middleware;

public class AuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly AppDb _db;

    public AuthMiddleware(RequestDelegate next, AppDb db)
    {
        _next = next;
        _db = db;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        var header = context.Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ") || header.Length <= 7)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "missing bearer token" });
            return;
        }

        var token = header["Bearer ".Length..];

        using var conn = await _db.OpenAsync();
        var user = await conn.QuerySingleOrDefaultAsync<CurrentUser>(
            @"SELECT u.id, u.organization_id, u.role
                FROM sessions s
                JOIN users u ON u.id = s.user_id
               WHERE s.token = @token AND s.expires_at > now()",
            new { token });

        if (user is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "invalid token" });
            return;
        }

        context.Items["User"] = user;
        await _next(context);
    }
}
