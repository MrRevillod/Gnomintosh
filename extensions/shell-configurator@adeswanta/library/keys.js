/**
 * SCKeys
 * Keys manager for prefs settings
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

/**
 * SCKeys
 *
 * Keys manager for prefs settings
 */
var SCKeys = class {
    /**
     * Class constructor
     */
    constructor() {
        this.keys = {};
    }

    /**
     * Create category configuration item
     * @returns {void}
     */
    addCategory(name, display, configName, description, supported) {
        if (!this.keys.hasOwnProperty(name)) {
            this.keys[name] = {
                'category': name,
                'displayName': display,
                'configName': configName,
                'description': description,
                'supported': supported,
                'configs': {}
            }
        }
    }

    /**
     * Log/Debug configuration keys into json format
     * @returns {void}
     */
    debugKeys() {
        log("[Shell Configurator] Configuration Keys");
        log(JSON.stringify(this.keys, null, 2));
    }

    _generateKey(
        category,
        id, name, display, description, type, supported, data, widget,
        idPrefix = "", schemaPrefix = ""
    ) {
        // Specific key data (especially for expand)
        let keyData = data.slice();
        if (type == 'expand') {
            let childKeys = [];

            if (Array.isArray(data)) {
                for (let key of data) {
                    childKeys.push(this._generateKey(
                        category,
                        key[0].replace(/-/g, "_"),
                        key[0],
                        key[1],
                        key[2],
                        key[3],
                        key[4],
                        key[5],
                        null,
                        id + '-',
                        name + '-'
                    ))
                }
            }
            
            keyData = childKeys;
        }
        return {
            'id': idPrefix + id, // Key ID
            'name': name, // Configuration name
            'display': display, // Configuration display name (ex: Panel size)
            'description': description, // Configuration description
            'category': category, // Configuration category
            'schemaID': (category + '-' + schemaPrefix + name).toLowerCase(), // Schema name
            'type': type, // Configuration type
            'supported': supported, // Configuration compatibility
            'data': keyData, // Configuration data
            'widget': widget // Control Widget
        };
    }

    /**
     * Create the preferences key object
     * @returns {void}
     */
    addKey(category, name, display, description, type, supported, data, widget) {
        // Use for widget/configuration id
        let id = category + '-' + name.replace(/-/g, "_");

        this.keys[category]["configs"][id] =
            this._generateKey(
                category,
                id, name, display, description, type, supported, data, widget
            );

    }

    /**
     * Removes all SCKeys
     * @returns {void}
     */
    resetEmpty() {
        if (this.keys != {}) {
            // Set to null object
            this.keys = {};
        }
    }

    /**
     * Gets all settings keys that saved to 'keys' object (publicly)
     * @returns {void}
     */
    getKeys() {
        // Return the keys
        return this.keys;
    }
}