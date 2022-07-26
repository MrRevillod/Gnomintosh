/**
 * Main Extension
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

'use strict';

// Import ui library
const {
    main:Main,
    overviewControls:OverviewControls,
    workspaceThumbnail:WorkspaceThumbnail,
} = imports.ui;

// Import Gettext for translation
const Gettext = imports.gettext;

// Define current extension path as Self and import it's library
const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    misc:Misc,
    manager:Manager,
    schema:Schema,
    components:Components
} = Self.imports.library;

// Define current GNOME Shell version
const shellVersion = imports.misc.config.PACKAGE_VERSION;

/**
 * Main Extension Class
 * Managing the extension functionality in one class
 */
var Extension = class {
    /**
     * Initialize the extension
     * @returns {void}
     */
    constructor() {}

    /**
     * Enable the extension
     * @returns {void}
     */
    enable() {
        // Define install type variable to get installation type after installation
        let installedAsUser = (Self.metadata['install-type'] == 'user') ? true : false;

        // Define settings schemas
        let shellSettings = Schema.newSchema('org.gnome.shell');
        let extensionPath = 'org.gnome.shell.extensions.shell-configurator';
        let extensionSettings =
            (installedAsUser) ?
                Schema.newSchemaFromSource(Self.dir.get_child('schema').get_path(), extensionPath)
            :   Schema.newSchema(extensionPath);

        // Define the new Manager class
        this.Manager = new Manager.SCManager(
            Self, Main, {
                // Some GNOME Schemas:
                'shellSettings': shellSettings,
                'extensionSettings': extensionSettings
            }, {
                // Libraries:
                'Components': new Components.SCComponents(parseFloat(shellVersion)),
                'Misc': new Misc.SCMisc(Main, Self, shellSettings)
            }, parseFloat(shellVersion)
        );
    }

    /**
     * Disable the extension
     * @returns {void}
     */
    disable() {
        this.Manager.restore();
        this.Manager.destroy();

        // Make class variables empty in order not to make increasing memory
        delete(this.Manager);
    }
}

/**
 * Initialize the extension
 * @returns {void}
 */
function init() {
    // Initialize translations
    imports.misc.extensionUtils.initTranslations();

    // Run the extension
    return new Extension();
}