const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	this.extensionName = 'sabrsorensen.partyowl84';
	this.cntx = context;

	const config = vscode.workspace.getConfiguration("partyowl84");

	let disableGlow = config && config.disableGlow ? !!config.disableGlow : false;

	let brightness = parseFloat(config.brightness) > 1 ? 1 : parseFloat(config.brightness);
	brightness = brightness < 0 ? 0 : brightness;
	brightness = isNaN(brightness) ? 0.45 : brightness;

	const parsedBrightness = Math.floor(brightness * 255).toString(16).toUpperCase();
	let neonBrightness = parsedBrightness;

	let disposable = vscode.commands.registerCommand('partyowl84.enablePartyLights', function () {

		const appDir = path.dirname(vscode.env.appRoot);
		const base = path.join(appDir, 'app', 'out', 'vs', 'code');
		const electronBase = isVSCodeBelowVersion("1.70.0") || isVSCodeAboveVersion("1.102.0") ? "electron-browser" : "electron-sandbox";
		const workBenchFilename = vscode.version == "1.94.0" ? "workbench.esm.html" : "workbench.html";

		const htmlFile = path.join(base, electronBase, "workbench", workBenchFilename);
		const templateFile = path.join(base, electronBase, "workbench", "partylights.js");

		try {

			// const version = context.globalState.get(`${context.extensionName}.version`);

			// generate production theme JS
			const chromeStyles = fs.readFileSync(__dirname + '/css/editor_chrome.css', 'utf-8');
			const jsTemplate = fs.readFileSync(__dirname + '/js/theme_template.js', 'utf-8');
			const themeWithGlow = jsTemplate.replace(/\[DISABLE_GLOW\]/g, disableGlow);
			const themeWithChrome = themeWithGlow.replace(/\[CHROME_STYLES\]/g, chromeStyles);
			const finalTheme = themeWithChrome.replace(/\[NEON_BRIGHTNESS\]/g, neonBrightness);
			fs.writeFileSync(templateFile, finalTheme, "utf-8");

			// modify workbench html
			const html = fs.readFileSync(htmlFile, "utf-8");

			// check if the tag is already there
			const isEnabled = html.includes("partylights.js");

			if (!isEnabled) {
				// delete partyowl84 script tag if there
				let output = html.replace(/^.*(<!-- PARTY OWL 84 --><script src="partylights.js"><\/script><!-- PARTY OWL 84 -->).*\n?/mg, '');
				// add script tag
				output = html.replace(/\<\/html\>/g, `	<!-- PARTY OWL 84 --><script src="partylights.js"></script><!-- PARTY OWL 84 -->\n`);
				output += '</html>';

				fs.writeFileSync(htmlFile, output, "utf-8");

				vscode.window
					.showInformationMessage("Party Lights enabled. VS code must reload for this change to take effect. Code may display a warning that it is corrupted, this is normal. You can dismiss this message by choosing 'Don't show this again' on the notification.", { title: "Restart editor to complete" })
					.then(function(msg) {
						vscode.commands.executeCommand("workbench.action.reloadWindow");
					});

			} else {
				vscode.window
					.showInformationMessage('Party Lights is already enabled. Reload to refresh JS settings.', { title: "Restart editor to refresh settings" })
					.then(function(msg) {
						vscode.commands.executeCommand("workbench.action.reloadWindow");
					});
			}
		} catch (e) {
			if (/ENOENT|EACCES|EPERM/.test(e.code)) {
				vscode.window.showInformationMessage("You must run VS code with admin privileges in order to enable Party Lights.");
				return;
			} else {
				vscode.window.showErrorMessage('Something went wrong when starting Party Lights');
				return;
			}
		}
	});

	let disable = vscode.commands.registerCommand('partyowl84.disablePartyLights', uninstall);

	context.subscriptions.push(disposable);
	context.subscriptions.push(disable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	// ...
}

function uninstall() {
	const appDir = path.dirname(vscode.env.appRoot);
	const base = path.join(appDir, 'app', 'out', 'vs', 'code');
	const electronBase = isVSCodeBelowVersion("1.70.0") || isVSCodeAboveVersion("1.102.0") ? "electron-browser" : "electron-sandbox";
	const workBenchFilename = vscode.version == "1.94.0" ? "workbench.esm.html" : "workbench.html";

	const htmlFile = path.join(base, electronBase, "workbench", workBenchFilename);

	// modify workbench html
	const html = fs.readFileSync(htmlFile, "utf-8");

	// check if the tag is already there
	const isEnabled = html.includes("partylights.js");

	if (isEnabled) {
		// delete synthwave script tag if there
		let output = html.replace(/^.*(<!-- PARTY OWL 84 --><script src="partylights.js"><\/script><!-- PARTY OWL 84 -->).*\n?/mg, '');
		fs.writeFileSync(htmlFile, output, "utf-8");

		vscode.window
			.showInformationMessage("Party Lights disabled. VS code must reload for this change to take effect", { title: "Restart editor to complete" })
			.then(function(msg) {
				vscode.commands.executeCommand("workbench.action.reloadWindow");
			});
	} else {
		vscode.window.showInformationMessage('Party Lights isn\'t running.');
	}
}

// Returns true if the VS Code version running this extension is below the
// version specified in the "version" parameter. Otherwise returns false.
function isVSCodeBelowVersion(version) {
	const vscodeVersion = vscode.version;
	const vscodeVersionArray = vscodeVersion.split('.').map(Number);
	const versionArray = version.split('.').map(Number);

	const len = Math.max(vscodeVersionArray.length, versionArray.length);

	for (let i = 0; i < len; i++) {
		const vscodePart = vscodeVersionArray[i] ?? 0;
		const versionPart = versionArray[i] ?? 0;

		if (vscodePart < versionPart) {
			return true;
		}

		if (vscodePart >= versionPart) {
			return false;
		}
	}

	return false;
}

// Returns true if the VS Code version running this extension is below the
// version specified in the "version" parameter. Otherwise returns false.
function isVSCodeAboveVersion(version) {
	const vscodeVersion = vscode.version;
	const vscodeVersionArray = vscodeVersion.split('.').map(Number);
	const versionArray = version.split('.').map(Number);

	const len = Math.max(vscodeVersionArray.length, versionArray.length);

	for (let i = 0; i < len; i++) {
		const vscodePart = vscodeVersionArray[i] ?? 0;
		const versionPart = versionArray[i] ?? 0;

		if (vscodePart >= versionPart) {
			return true;
		}

		if (vscodePart < versionPart) {
			return false;
		}
	}

	return false;
}

module.exports = {
	activate,
	deactivate
}
