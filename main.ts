import { Editor, Notice, Plugin } from "obsidian";
import {
  R2UploaderSettings,
  DEFAULT_SETTINGS,
  R2UploaderSettingTab,
} from "./src/settings";
import { uploadToR2 } from "./src/r2Client";
import { resolvePathTemplate, sanitizeFileName } from "./src/pathTemplate";
import { registerPasteHandler } from "./src/handlers/pasteHandler";
import { registerDropHandler } from "./src/handlers/dropHandler";

export default class R2ImageUploaderPlugin extends Plugin {
  settings: R2UploaderSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new R2UploaderSettingTab(this.app, this));
    registerPasteHandler(this);
    registerDropHandler(this);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  isConfigured(): boolean {
    const s = this.settings;
    return !!(
      s.accountId &&
      s.bucketName &&
      s.accessKeyId &&
      s.secretAccessKey &&
      s.publicBaseUrl
    );
  }

  async uploadAndInsert(editor: Editor, file: File): Promise<void> {
    if (!this.isConfigured()) {
      new Notice(
        "R2 Image Uploader: Please configure the plugin settings first."
      );
      return;
    }

    const { fileName, ext } = sanitizeFileName(
      file.name || `image-${Date.now()}.png`
    );
    const placeholderId = Math.random().toString(36).substring(2, 8);
    const placeholder = `![Uploading… (${placeholderId})]()`;

    // Insert placeholder at current cursor
    const cursor = editor.getCursor();
    editor.replaceRange(placeholder, cursor);

    try {
      const key = resolvePathTemplate(
        this.settings.pathTemplate,
        fileName,
        ext
      );
      const buffer = await file.arrayBuffer();

      await uploadToR2(this.settings, key, buffer, file.type || "image/png");

      const publicUrl = `${this.settings.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
      const markdownLink = `![${fileName}](${publicUrl})`;

      // Try to find and replace placeholder
      const content = editor.getValue();
      const idx = content.indexOf(placeholder);
      if (idx !== -1) {
        const from = editor.offsetToPos(idx);
        const to = editor.offsetToPos(idx + placeholder.length);
        editor.replaceRange(markdownLink, from, to);
      } else {
        // Placeholder was modified — insert at current cursor instead
        editor.replaceRange(markdownLink, editor.getCursor());
      }
    } catch (err) {
      // Remove placeholder if still present
      const content = editor.getValue();
      const idx = content.indexOf(placeholder);
      if (idx !== -1) {
        const from = editor.offsetToPos(idx);
        const to = editor.offsetToPos(idx + placeholder.length);
        editor.replaceRange("", from, to);
      }

      const msg = err instanceof Error ? err.message : "Unknown error";
      new Notice(`R2 upload failed: ${msg}`);
    }
  }
}
