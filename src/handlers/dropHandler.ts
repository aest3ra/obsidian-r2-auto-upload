import { Editor } from "obsidian";
import type R2ImageUploaderPlugin from "../../main";

function getDropPosition(
  editor: Editor,
  evt: DragEvent
): { line: number; ch: number } {
  try {
    // Access CodeMirror 6 EditorView for accurate drop position
    const cm = (editor as unknown as { cm: { posAtCoords: (coords: { x: number; y: number }, precise?: boolean) => number | null } }).cm;
    if (cm) {
      const offset = cm.posAtCoords(
        { x: evt.clientX, y: evt.clientY },
        false
      );
      if (offset != null) {
        return editor.offsetToPos(offset);
      }
    }
  } catch {
    // Fall back to current cursor position
  }
  return editor.getCursor();
}

export function registerDropHandler(plugin: R2ImageUploaderPlugin): void {
  plugin.registerEvent(
    plugin.app.workspace.on(
      "editor-drop",
      async (evt: DragEvent, editor) => {
        const files = evt.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return;

        evt.preventDefault();

        // Move cursor to drop position
        const pos = getDropPosition(editor, evt);
        editor.setCursor(pos);

        for (const file of imageFiles) {
          await plugin.uploadAndInsert(editor, file);
        }
      }
    )
  );
}
