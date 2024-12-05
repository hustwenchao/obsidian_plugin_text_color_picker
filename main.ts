import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface TextColorSettings {
	colors: string[];
	colorEmojis: { [key: string]: string };
}

const DEFAULT_TEXT_COLOR_SETTINGS: TextColorSettings = {
	colors: ['red', 'blue', 'green', 'purple', 'orange'],
	colorEmojis: {
		'red': '🔴',
		'blue': '🔵',
		'green': '🟢',
		'purple': '🟣',
		'orange': '🟠'
	}
}

export default class MyPlugin extends Plugin {
	textColorSettings: TextColorSettings;

	async onload() {
		await this.loadTextColorSettings();

		// 为每个颜色添加命令
		this.textColorSettings.colors.forEach(color => {
			const colorEmoji = this.textColorSettings.colorEmojis[color] || '⬤';

			this.addCommand({
				id: `set-text-${color}`,
				name: `Set Text To ${color} ${colorEmoji}`,
				editorCallback: (editor: Editor) => {
					this.setTextColor(editor, color);
				}
			});
		});

		// 添加设置选项卡
		this.addSettingTab(new TextColorSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadTextColorSettings() {
		this.textColorSettings = Object.assign({}, DEFAULT_TEXT_COLOR_SETTINGS, await this.loadData());
	}

	async saveTextColorSettings() {
		await this.saveData(this.textColorSettings);
	}

	setTextColor(editor: Editor, color: string) {
		const selectedText = editor.getSelection();
		if (selectedText) {
			const coloredText = `<span style="color: ${color}">${selectedText}</span>`;
			editor.replaceSelection(coloredText);
		}
	}

	reloadPlugin() {
		this.unload();
		this.load();
	}
}

class TextColorSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Text Color Settings'});

		// 颜色列表容器
		const colorListContainer = containerEl.createDiv('color-list-container');
		
		// 添加新颜色的设置
		new Setting(containerEl)
			.setName('Add New Color')
			.setDesc('Add a new color to the list')
			.addText(text => text
				.setPlaceholder('Color name (e.g., red)')
				.setValue('')
				.onChange(() => {}))
			.addText(text => text
				.setPlaceholder('Emoji (e.g., 🔴)')
				.setValue('')
				.onChange(() => {}))
			.addButton(button => button
				.setButtonText('Add')
				.onClick(async () => {
					const colorInput = containerEl.querySelector('.add-color-input') as HTMLInputElement;
					const emojiInput = containerEl.querySelector('.add-color-emoji-input') as HTMLInputElement;
					const color = colorInput?.value.trim();
					const emoji = emojiInput?.value.trim();

					if (color && emoji) {
						this.plugin.textColorSettings.colors.push(color);
						this.plugin.textColorSettings.colorEmojis[color] = emoji;
						await this.plugin.saveTextColorSettings();
						this.plugin.reloadPlugin();
						this.display(); // 刷新设置界面
						colorInput.value = '';
						emojiInput.value = '';
					}
				}));

		// 显示现有颜色列表
		this.plugin.textColorSettings.colors.forEach(color => {
			const emoji = this.plugin.textColorSettings.colorEmojis[color] || '⬤';
			new Setting(colorListContainer)
				.setName(color)
				.setDesc(`Current emoji: ${emoji}`)
				.addText(text => text
					.setPlaceholder('New emoji')
					.setValue('')
					.onChange(async (value) => {
						if (value.trim()) {
							this.plugin.textColorSettings.colorEmojis[color] = value.trim();
							await this.plugin.saveTextColorSettings();
							this.plugin.reloadPlugin();
							this.display(); // 刷新设置界面
						}
					}))
				.addButton(button => button
					.setButtonText('Delete')
					.setClass('color-delete-button')
					.onClick(async () => {
						const index = this.plugin.textColorSettings.colors.indexOf(color);
						if (index > -1) {
							this.plugin.textColorSettings.colors.splice(index, 1);
							delete this.plugin.textColorSettings.colorEmojis[color];
							await this.plugin.saveTextColorSettings();
							this.plugin.reloadPlugin();
							this.display(); // 刷新设置界面
						}
					}));
		});
	}
}
