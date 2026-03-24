# Obsidian R2 Image Uploader

A minimal Obsidian plugin that automatically uploads **pasted** or **drag-and-dropped** images to [Cloudflare R2](https://developers.cloudflare.com/r2/) and inserts standard Markdown image links into your notes.

- Cloudflare R2 only
- Images only (other file types fall through to Obsidian's default behavior)
- Desktop only

## Supported Workflows

- **Paste**: Copy an image (screenshot, browser image, etc.) and paste into the editor → uploaded to R2 → `![filename](url)` inserted
- **Drag & Drop**: Drag an image file from Finder/Explorer into the editor → uploaded to R2 → `![filename](url)` inserted

## How It Works

1. An image paste or drop event is detected.
2. A placeholder `![Uploading… (id)]()` is inserted at the cursor.
3. The image is uploaded to R2 via the S3-compatible API.
4. On success, the placeholder is replaced with `![filename](public-url)`.
5. On failure, the placeholder is removed and an error notice is shown.

If the placeholder is edited during upload, the final link is safely inserted at the current cursor position instead.

## Cloudflare R2 Setup

You need the following from your Cloudflare dashboard:

| Setting | Where to Find |
|---------|--------------|
| **Account ID** | Cloudflare dashboard → Overview → right sidebar |
| **Bucket Name** | R2 → Overview → your bucket name |
| **Access Key ID** | R2 → Overview → Manage R2 API Tokens → Create API Token |
| **Secret Access Key** | Shown once when creating the API token |
| **Public Base URL** | R2 → your bucket → Settings → Public access (e.g., `https://pub-xxx.r2.dev` or a custom domain) |

Make sure the API token has **Object Read & Write** permission for the target bucket.

## Example Settings

| Field | Example |
|-------|---------|
| Account ID | `a1b2c3d4e5f6...` |
| Bucket Name | `my-obsidian-images` |
| Access Key ID | `abc123...` |
| Secret Access Key | `secret456...` |
| Public Base URL | `https://img.example.com` |
| Path Template | `obsidian/{year}/{month}/{day}/{fileName}-{timestamp}.{ext}` |

### Path Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{year}` | 4-digit year | `2025` |
| `{month}` | 2-digit month | `03` |
| `{day}` | 2-digit day | `15` |
| `{timestamp}` | Unix timestamp (ms) | `1710504000000` |
| `{fileName}` | Sanitized original filename | `screenshot` |
| `{ext}` | File extension | `png` |

## Installation

### Community Plugins

1. Settings → Community plugins → Browse
2. Search for "R2 Image Uploader"
3. Install → Enable
4. Configure the plugin settings with your R2 credentials

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/aest3ra/obsidian-image-auto-uploader/releases)
2. Create `.obsidian/plugins/obsidian-r2-image-uploader/` in your vault
3. Copy the downloaded files into that directory
4. Restart Obsidian (or reload plugins)
5. Enable **R2 Image Uploader** in Settings → Community plugins
6. Configure the plugin settings

## Build

```bash
pnpm install
pnpm run build
```

For development with auto-rebuild:

```bash
pnpm run dev
```

## Releases

1. Update `version` in `manifest.json` and `package.json`
2. Add the new version mapping to `versions.json`
3. Create and push a git tag:
   ```bash
   git tag 1.0.0
   git push origin 1.0.0
   ```
4. GitHub Actions will automatically build and attach `main.js` and `manifest.json` to the release

## Security

This plugin makes external network requests. Please read this section before use.

### Network Communication

- Uploads images to the Cloudflare R2 S3 endpoint (`https://<account-id>.r2.cloudflarestorage.com`)
- No other external services are contacted
- Test Connection uses the same R2 endpoint

### Credential Storage

- You provide: **Account ID**, **Bucket Name**, **Access Key ID**, **Secret Access Key**, **Public Base URL**
- These are stored in Obsidian's plugin data file (`data.json`) in plaintext
- `data.json` is located at `.obsidian/plugins/obsidian-r2-image-uploader/` in your vault
- Credentials are never included in error messages or logs
- Secret Access Key is masked in the settings UI

### Recommendations

- **Grant minimal permissions**: The API token only needs Object Read & Write for the target bucket
- **Be careful when sharing your vault**: The `.obsidian` folder contains `data.json` with your credentials
- The source code is open and can be audited by anyone

## Known Limitations

- Desktop only (not tested on Obsidian mobile)
- Only images are handled — other file types pass through to Obsidian's default behavior
- Uploading is sequential per paste/drop event (not parallel)
- Uses standard Markdown `![alt](url)` — not Obsidian wiki-links `![[file]]`
- R2 endpoint is derived from the Account ID, region is always `auto`

## Troubleshooting

### "Please configure the plugin settings first"
Make sure all fields are filled in: Account ID, Bucket Name, Access Key ID, Secret Access Key, and Public Base URL.

### Test Connection: "Access denied"
- Verify the API token has **Object Read & Write** permission for the target bucket
- Double-check Access Key ID and Secret Access Key

### Test Connection: "Bucket not found"
- Verify Account ID (Cloudflare dashboard → Overview → right sidebar)
- Verify Bucket Name (case-sensitive)

### Images upload but don't display
- Check that Public Base URL is correct
- Make sure Public access is enabled on the R2 bucket
- If using a custom domain, verify DNS settings

### Images saved locally instead of uploading
- Check that the plugin is enabled (Settings → Community plugins)
- Make sure the pasted/dropped item is an image file

## Support

If you find this plugin useful, you can buy me a coffee:

<a href="https://www.buymeacoffee.com/aestera">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200">
</a>

## License

[MIT](LICENSE)
