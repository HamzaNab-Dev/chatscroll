using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

/// <summary>
/// Reads the caller's identity from the "X-User-Id" request header.
/// Falls back to the original mock ID so existing test clients without the header still work.
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
    private static readonly Guid FallbackUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    protected Guid GetUserId()
    {
        var header = Request.Headers["X-User-Id"].FirstOrDefault();
        return Guid.TryParse(header, out var parsed) ? parsed : FallbackUserId;
    }
}
