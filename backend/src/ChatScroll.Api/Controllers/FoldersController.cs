using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoldersController : ControllerBase
{
    private readonly IFolderRepository _folderRepository;
    private static readonly Guid MockUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public FoldersController(IFolderRepository folderRepository)
    {
        _folderRepository = folderRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var folders = await _folderRepository.GetByUserIdAsync(MockUserId);
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
        var folders = (await _folderRepository.GetByUserIdAsync(MockUserId)).ToList();
        var roots = folders.Where(f => f.ParentId == null).ToList();
        return Ok(BuildTree(roots, folders));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var folder = await _folderRepository.GetByIdAsync(id, MockUserId);
        if (folder is null) return NotFound();
        return Ok(folder);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFolderRequest request)
    {
        var folder = new Folder
        {
            UserId = MockUserId,
            Name = request.Name,
            Path = request.Path,
            Icon = request.Icon,
            Color = request.Color,
            ParentId = request.ParentId
        };
        var created = await _folderRepository.CreateAsync(folder);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _folderRepository.DeleteAsync(id, MockUserId);
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
