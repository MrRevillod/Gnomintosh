/**
 * Search Result Item Widget
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, GObject } = imports.gi;

/**
 * Search Result Item Widget
 */
var SearchResultItem = GObject.registerClass({
    GTypeName: 'SearchResultItem',
    Template: `file://${Self.dir.get_child('ui').get_path()}/search-result-item.ui`,
    InternalChildren: ['configName', 'configLocation']
}, class SearchResultItem extends Gtk.Box {
    _init(name, location) {
        super._init();

        this._configName.set_label(name);
        this._configLocation.set_label(location);
    }
});