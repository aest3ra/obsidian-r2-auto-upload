import type R2ImageUploaderPlugin from "../../main";

export function registerPasteHandler(plugin: R2ImageUploaderPlugin): void {
  plugin.registerEvent(
    plugin.app.workspace.on(
      "editor-paste",
      async (evt: ClipboardEvent, editor) => {
        const files = evt.clipboardData?.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return;

        evt.preventDefault();

        for (const file of imageFiles) {
          await plugin.uploadAndInsert(editor, file);
        }
      }
    )
  );
}
