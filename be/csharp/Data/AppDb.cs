using System.Data;
using Npgsql;

namespace Api.Data;

public class AppDb
{
    private readonly string _connectionString;

    public AppDb(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<IDbConnection> OpenAsync()
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        return conn;
    }
}

public record CurrentUser(int Id, int OrganizationId, string Role);

public record Project(int Id, string Name, string Description, string Status, DateTime CreatedAt);

public record TaskRow(int Id, string Title, bool Done, DateTime CreatedAt);
