/**
 * Module template
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

// ONLY MODIFY THIS FILE IF NEEDED.

const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    schema:Schema,
    misc:Misc,
} = Self.imports.library;

/**
 * Module Template
 *
 * See CONTRIBUTING.md for more information.
 */
var ConfigurationModule = class {
    /**
     * Class constructor
     * > Do something when this module is initializing
     */
    constructor() {
        // UI Main
        this._Main = imports.ui.main;

        // Util library from misc
        this._Util = imports.misc.util;

        // SC libraries
        this._Misc = new Misc.SCMisc(this._Main, Self, Schema.newSchema('org.gnome.shell'));

        // Private declarations
        this._shellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);
    }

    /**
     * Backup shell properties
     * > Do something when you want to backup the shell properties
     * @returns {void}
     */
    backup() {
        if (this._origin) { this._origin = {}; }
    }

    /**
     * Restore properties
     * > Do something when you want to restore the shell properties
     * @returns {void}
     */
    restore() { }
}