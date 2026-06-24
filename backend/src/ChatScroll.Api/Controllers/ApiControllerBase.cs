using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace ChatScroll.Api.Controllers;

/// <summary>
/// Identity resolution order:
///   1. Authorization: Bearer &lt;cognitoJwt&gt; → decode payload, parse sub as Guid
///   2. X-User-Id header → parse as Guid (anonymous browser users)
///   3. Hard-coded fallback (local dev only)
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
    private static readonly Guid FallbackUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    protected Guid GetUserId() => GetCallerInfo().UserId;

    /// <summary>Returns userId plus email/displayName extracted from Cognito JWT (null for anonymous users).</summary>
    protected (Guid UserId, string? Email, string? DisplayName) GetCallerInfo()
    {
        var auth = Request.Headers["Authorization"].FirstOrDefault();
        if (auth is not null && auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = auth["Bearer ".Length..].Trim();
            var (sub, email, name) = DecodeJwtPayload(token);
            if (sub is not null && Guid.TryParse(sub, out var cognitoGuid))
                return (cognitoGuid, email, name);
        }

        var header = Request.Headers["X-User-Id"].FirstOrDefault();
        return (Guid.TryParse(header, out var parsed) ? parsed : FallbackUserId, null, null);
    }

    private static (string? Sub, string? Email, string? Name) DecodeJwtPayload(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3) return (null, null, null);

            var payload = parts[1];
            // Fix missing base64 padding
            payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var sub   = root.TryGetProperty("sub",   out var s) ? s.GetString() : null;
            var email = root.TryGetProperty("email", out var e) ? e.GetString() : null;
            var name  = root.TryGetProperty("name",  out var n) ? n.GetString() : null;
            return (sub, email, name);
        }
        catch { return (null, null, null); }
    }
}
