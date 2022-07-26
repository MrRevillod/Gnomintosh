/**
 * SCMisc
 * Some additional functions and tools for Shell Configurator
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Translations
const Gettext = imports.gettext;
const Domain = Gettext.domain(Self.metadata['gettext-domain']);
const _ = Domain.gettext;

/**
 * SCMisc
 *
 * Some additional functions and tools for Shell Configurator
 */
var SCMisc = class {
    /**
     * Class constructor
     */
    constructor(Main, currentPath, shellSettings) {
        this._Main = Main;
        this._currentPath = currentPath;
        this._shellSettings = shellSettings;

        this._shellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);
    }

    /**
     * Check if this extension is enabled
     * @returns {boolean}
     */
    isExtensionEnabled() {
        return this._shellSettings.get_strv('enabled-extensions').includes(
            this._currentPath.metadata['uuid']
        );
    }

    /**
     * Get extension class name so that it can add the style name correctly
     * @returns {string}
     */
    getSCStyle(className, support) {
        if (support == 'all')
            return 'sc-' + className;
        else
            return 'sc-' + className + '-' + support.replace('.', '');
    }

    /**
     * Convert byte array to string
     * @returns {string}
     */
    byteArrayToString(byteArray) {
        if (byteArray) {
            if (this._shellVersion >= 41)
                return new TextDecoder('utf-8').decode(byteArray);
            else
                return imports.byteArray.toString(byteArray);
        }
    }
}