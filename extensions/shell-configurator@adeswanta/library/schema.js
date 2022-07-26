/**
 * SCSchema
 * Settings schema manager
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

// Import Gio libraries from gi
const { Gio } = imports.gi;

/**
 * Create new Gio Settings from default schemas folder (/usr/share/glib-2.0/schemas)
 * @returns {Gio.Settings}
 */
function newSchema(schemaPath) {
    // Returning Gio.Settings with default schema source
    return new Gio.Settings({
        schema_id: schemaPath
    });
}

/**
 * Create new Gio Settings from custom schema source
 * @returns {Gio.Settings}
 */
function newSchemaFromSource(sourcePath, schemaPath) {
    // Add custom schema source path
    let schemaSource = Gio.SettingsSchemaSource.new_from_directory(
        sourcePath, // 'schemas' directory path
        Gio.SettingsSchemaSource.get_default(), // parent
        false // trusted schema
    );

    // Returning Gio.Settings with custom schema source
    return new Gio.Settings({
        settings_schema : schemaSource.lookup(schemaPath, true)
    });
}