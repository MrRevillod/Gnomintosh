/**
 * Module Section Widget
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, GObject } = imports.gi;

/**
 * Module Section Widget
 */
var ModuleSection = GObject.registerClass({
    GTypeName: 'ModuleSection',
    Template: `file://${Self.dir.get_child('ui').get_path()}/module-section.ui`,
    InternalChildren: ['moduleTitle', 'moduleDescription', 'configs']
}, class ModuleSection extends Gtk.Box {
    _init(id, title, description) {
        super._init({ name: id });

        this._moduleTitle.set_label(title);
        this._moduleDescription.set_label(description);
    }
});