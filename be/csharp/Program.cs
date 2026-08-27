using Api.Data;
using Api.Middleware;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

DefaultTypeMap.MatchNamesWithUnderscores = true;

builder.Services.AddControllers();
builder.Services.AddSingleton(new AppDb(builder.Configuration.GetConnectionString("Default")!));

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { ok = true }));

app.UseMiddleware<AuthMiddleware>();
app.MapControllers();

app.Run();
