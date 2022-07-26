/**
 * Extension Preferences Dialog
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

// Define current extension path and import it's library
const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    preferences:Preferences,
    keys:Keys,
    misc:Misc,
    schema:Schema
} = Self.imports.library;

// Import Gettext for translation
const Gettext = imports.gettext;

// Define current GNOME Shell version
const shellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

// Define extension metadata
const SCMetadata = Self.metadata;

/**
 * Initialize preferences dialog
 * @returns {void}
 */
function init() {
    // Initialize translations
    imports.misc.extensionUtils.initTranslations()
}

/**
 * Load preferences system
 * @returns {SCPrefs}
 */
function loadPrefs() {
    // Define install type variable to get installation type after installation
    let installedAsUser = (SCMetadata['install-type'] == 'user') ? true : false;

    // Define settings schemas
    let extensionPath = 'org.gnome.shell.extensions.shell-configurator';
    let extensionSettings =
        (installedAsUser) ?
            Schema.newSchemaFromSource(Self.dir.get_child('schema').get_path(), extensionPath)
        :   Schema.newSchema(extensionPath);

    // Return created SCPrefs class
    return new Preferences.SCPrefs(Self, {
        "Keys": new Keys.SCKeys(),
        "Misc": new Misc.SCMisc()
    }, extensionSettings, shellVersion);
}

/**
 * Fill preferences window for Adw.PreferencesWindow
 * @returns {Adw.PreferencesWindow}
 */
function fillPreferencesWindow(window) {
    // Build Prefs UI to fill preferences window. See preferences.js on library
    loadPrefs().buildUI(window);
}

/**
 * Build preferences widget
 * @returns {Gtk.Widget}
 */
function buildPrefsWidget() {
    // Build Prefs UI and return as content widget. See preferences.js on library
    return loadPrefs().buildUI();
}