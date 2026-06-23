using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoldersController : ApiControllerBase
{
    private readonly IFolderRepository _folderRepository;

    public FoldersController(IFolderRepository folderRepository)
    {
        _folderRepository = folderRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var folders = await _folderRepository.GetByUserIdAsync(userId);
        return Ok(folders);
    }

    /// <summary>
    /// Returns the full folder hierarchy as a nested tree.
    /// Production: uses Aurora ltree — SELECT * FROM folders WHERE user_id = ? ORDER BY path
    /// ltree path ordering guarantees parents always precede their children:
    ///   'programming' &lt; 'programming.dotnet' &lt; 'programming.dotnet.ef_core'
    /// </summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var userId = GetUserId();
        var folders = (await _folderRepository.GetByUserIdAsync(userId)).ToList();
        var roots = folders.Where(f => f.ParentId == null).ToList();
        return Ok(BuildTree(roots, folders));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var folder = await _folderRepository.GetByIdAsync(id, userId);
        if (folder is null) return NotFound();
        return Ok(folder);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFolderRequest request)
    {
        var userId = GetUserId();
        var folder = new Folder
        {
            UserId = userId,
            Name = request.Name,
            Path = request.Path,
            Icon = request.Icon,
            Color = request.Color,
            ParentId = request.ParentId
        };
        var created = await _folderRepository.CreateAsync(folder);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFolderRequest request)
    {
        var userId = GetUserId();
        var folder = await _folderRepository.GetByIdAsync(id, userId);
        if (folder is null) return NotFound();

        folder.Name = request.Name;
        if (request.Icon is not null) folder.Icon = request.Icon;

        var updated = await _folderRepository.UpdateAsync(folder);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _folderRepository.DeleteAsync(id, userId);
        return NoContent();
    }

    private static IEnumerable<object> BuildTree(IEnumerable<Folder> nodes, List<Folder> all) =>
        nodes.Select(f => (object)new
        {
            f.Id,
            f.Name,
            f.Path,
            f.Icon,
            f.Color,
            f.NoteCount,
            f.ParentId,
            children = BuildTree(all.Where(c => c.ParentId == f.Id).ToList(), all)
        });
}

public record CreateFolderRequest(
    string Name,
    string Path,
    string? Icon,
    string? Color,
    Guid? ParentId
);

public record UpdateFolderRequest(string Name, string? Icon);
