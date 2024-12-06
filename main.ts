import { addIcon, App, Editor, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface TextColorSettings {
	colors: Array<{
		name: string;
		value: string;
		emoji?: string;
	}>;
}

const DEFAULT_TEXT_COLOR_SETTINGS: TextColorSettings = {
	colors: [
		{ name: 'Red', value: '#FF0000', emoji: '🔴' },
		{ name: 'Blue', value: '#0000FF', emoji: '🔵' },
		{ name: 'Green', value: '#00FF00', emoji: '🟢' },
		{ name: 'Purple', value: '#800080', emoji: '🟣' },
		{ name: 'Orange', value: '#FFA500', emoji: '🟠' }
	]
}

export default class MyPlugin extends Plugin {
	textColorSettings: TextColorSettings;

	async onload() {
		await this.loadTextColorSettings();

		// 为每个颜色添加命令
		this.textColorSettings.colors.forEach(color => {
			const displayName = `${color.name}`;  

			// 注册Icon
			addIcon(`text-color-${color.name.toLowerCase()}`, `<circle cx="50" cy="50" r="50" fill="${color.value}" />`);

			this.addCommand({
				id: `set-text-${color.name.toLowerCase()}`,
				name: `Text Color: ${displayName}`, 
				icon: `text-color-${color.name.toLowerCase()}`,
				editorCallback: (editor: Editor) => {
					this.setTextColor(editor, color.value);
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
		let nameInputEl: HTMLInputElement;
		let colorValue = '#000000';
		let emojiInputEl: HTMLInputElement;

		new Setting(containerEl)
			.setName('Add New Color')
			.setDesc('Add a new color to the list')
			.addText(text => {
				nameInputEl = text
					.setPlaceholder('Color name (e.g., Dark Red)')
					.inputEl;
				return text;
			})
			.addColorPicker(color => {
				color.setValue(colorValue)
					.onChange(value => {
						colorValue = value;
					});
				return color;
			})
			.addText(text => {
				emojiInputEl = text
					.setPlaceholder('Emoji (optional)')
					.inputEl;
				return text;
			})
			.addButton(button => button
				.setButtonText('Add')
				.onClick(async () => {
					const name = nameInputEl.value.trim();
					const emoji = emojiInputEl.value.trim();

					if (name && colorValue) {
						this.plugin.textColorSettings.colors.push({
							name,
							value: colorValue,
							...(emoji ? { emoji } : {})
						});
						await this.plugin.saveTextColorSettings();
						this.display();
						
						nameInputEl.value = '';
						colorValue = '#000000';
						emojiInputEl.value = '';
					}
				}));

		// 显示现有颜色列表
		this.plugin.textColorSettings.colors.forEach((color, index) => {
			const setting = new Setting(colorListContainer)
				.setName(color.name)
				.setDesc(`Color: ${color.value}${color.emoji ? ` Emoji: ${color.emoji}` : ''}`);

			// 添加颜色选择器
			setting.addColorPicker(picker => picker
				.setValue(color.value)
				.onChange(async (value) => {
					this.plugin.textColorSettings.colors[index].value = value;
					await this.plugin.saveTextColorSettings();
				}));

			// 添加 Emoji 输入框（可选）
			setting.addText(text => text
				.setPlaceholder('Emoji (optional)')
				.setValue(color.emoji || '')
				.onChange(async (value) => {
					this.plugin.textColorSettings.colors[index].emoji = value.trim() || undefined;
					await this.plugin.saveTextColorSettings();
				}));

			// 添加删除按钮
			setting.addButton(button => button
				.setButtonText('Delete')
				.setClass('color-delete-button')
				.onClick(async () => {
					this.plugin.textColorSettings.colors.splice(index, 1);
					await this.plugin.saveTextColorSettings();
					this.display();
				}));
		});
	}
}
