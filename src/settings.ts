import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type R2ImageUploaderPlugin from "../main";
import { testConnection } from "./r2Client";

export interface R2UploaderSettings {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  pathTemplate: string;
}

export const DEFAULT_SETTINGS: R2UploaderSettings = {
  accountId: "",
  bucketName: "",
  accessKeyId: "",
  secretAccessKey: "",
  publicBaseUrl: "",
  pathTemplate: "obsidian/{year}/{month}/{day}/{fileName}-{timestamp}.{ext}",
};

export class R2UploaderSettingTab extends PluginSettingTab {
  plugin: R2ImageUploaderPlugin;

  constructor(app: App, plugin: R2ImageUploaderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "R2 Image Uploader Settings" });

    new Setting(containerEl)
      .setName("Account ID")
      .setDesc("Cloudflare account ID (used to build the R2 endpoint)")
      .addText((text) =>
        text
          .setPlaceholder("your-account-id")
          .setValue(this.plugin.settings.accountId)
          .onChange(async (value) => {
            this.plugin.settings.accountId = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Bucket Name")
      .setDesc("R2 bucket name")
      .addText((text) =>
        text
          .setPlaceholder("my-images")
          .setValue(this.plugin.settings.bucketName)
          .onChange(async (value) => {
            this.plugin.settings.bucketName = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Access Key ID")
      .setDesc("R2 API token – Access Key ID")
      .addText((text) =>
        text
          .setPlaceholder("your-access-key-id")
          .setValue(this.plugin.settings.accessKeyId)
          .onChange(async (value) => {
            this.plugin.settings.accessKeyId = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Secret Access Key")
      .setDesc("R2 API token – Secret Access Key")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("your-secret-access-key")
          .setValue(this.plugin.settings.secretAccessKey)
          .onChange(async (value) => {
            this.plugin.settings.secretAccessKey = value.trim();
          });
      });

    new Setting(containerEl)
      .setName("Public Base URL")
      .setDesc(
        "Public URL for the bucket (e.g. https://pub-xxx.r2.dev or https://img.example.com)"
      )
      .addText((text) =>
        text
          .setPlaceholder("https://pub-xxx.r2.dev")
          .setValue(this.plugin.settings.publicBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.publicBaseUrl = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Path Template")
      .setDesc(
        "Upload path template. Variables: {year}, {month}, {day}, {timestamp}, {fileName}, {ext}"
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.pathTemplate)
          .setValue(this.plugin.settings.pathTemplate)
          .onChange(async (value) => {
            this.plugin.settings.pathTemplate = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Test Connection")
      .setDesc("Verify R2 bucket access with current settings")
      .addButton((btn) =>
        btn.setButtonText("Test Connection").onClick(async () => {
          const s = this.plugin.settings;
          if (!s.accountId || !s.bucketName || !s.accessKeyId || !s.secretAccessKey) {
            new Notice("Please fill in Account ID, Bucket Name, Access Key ID, and Secret Access Key first.");
            return;
          }
          btn.setDisabled(true);
          btn.setButtonText("Testing...");
          try {
            await testConnection(s);
            new Notice("R2 connection successful!");
          } catch (e) {
            new Notice(
              `R2 connection failed: ${e instanceof Error ? e.message : "Unknown error"}`
            );
          } finally {
            btn.setDisabled(false);
            btn.setButtonText("Test Connection");
          }
        })
      );

    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("Save")
        .setCta()
        .onClick(async () => {
          await this.plugin.saveSettings();
          new Notice("Settings saved");
        })
    );
  }
}
