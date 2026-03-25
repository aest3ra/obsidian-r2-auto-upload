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

    new Setting(containerEl)
      .setName("Account ID")
      .setDesc("Cloudflare account ID for building the endpoint")
      .addText((text) =>
        text
          .setPlaceholder("Your account ID")
          .setValue(this.plugin.settings.accountId)
          .onChange((value) => {
            this.plugin.settings.accountId = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Bucket name")
      .setDesc("R2 bucket name")
      .addText((text) =>
        text
          .setPlaceholder("My images")
          .setValue(this.plugin.settings.bucketName)
          .onChange((value) => {
            this.plugin.settings.bucketName = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Access key ID")
      .setDesc("R2 API token – access key ID")
      .addText((text) =>
        text
          .setPlaceholder("Your access key ID")
          .setValue(this.plugin.settings.accessKeyId)
          .onChange((value) => {
            this.plugin.settings.accessKeyId = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Secret access key")
      .setDesc("R2 API token – secret access key")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("Your secret access key")
          .setValue(this.plugin.settings.secretAccessKey)
          .onChange((value) => {
            this.plugin.settings.secretAccessKey = value.trim();
          });
      });

    new Setting(containerEl)
      .setName("Public base URL")
      .setDesc(
        "Public URL for the bucket (e.g. https://pub-xxx.r2.dev or https://img.example.com)"
      )
      .addText((text) =>
        text
          .setPlaceholder("https://pub-xxx.r2.dev")
          .setValue(this.plugin.settings.publicBaseUrl)
          .onChange((value) => {
            this.plugin.settings.publicBaseUrl = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Path template")
      .setDesc(
        "Upload path template. Variables: {year}, {month}, {day}, {timestamp}, {fileName}, {ext}"
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.pathTemplate)
          .setValue(this.plugin.settings.pathTemplate)
          .onChange((value) => {
            this.plugin.settings.pathTemplate = value.trim();
          })
      );

    new Setting(containerEl)
      .setName("Test connection")
      .setDesc("Verify that your bucket is accessible")
      .addButton((btn) =>
        btn.setButtonText("Test connection").onClick(async () => {
          const s = this.plugin.settings;
          if (!s.accountId || !s.bucketName || !s.accessKeyId || !s.secretAccessKey) {
            new Notice("Please fill in account ID, bucket name, access key ID, and secret access key first.");
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
            btn.setButtonText("Test connection");
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
