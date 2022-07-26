/**
 * Expandable Configuration Item Widget
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, GObject } = imports.gi;

const configItem = Self.imports.widgets.configItem;

/**
 * Expandable Configuration Item Widget
 */
var ExpandableConfigItem = GObject.registerClass({
    GTypeName: 'ExpandableConfigItem',
    Template: `file://${Self.dir.get_child('ui').get_path()}/expandable-config-item.ui`,
    InternalChildren: ['configName', 'configDescription', 'configs']
}, class ExpandableConfigItem extends Gtk.Box {
    _init(prefs, key) {
        super._init({ name: key.id });

        this._configName.set_label(key.display);

        if (key.description || key.description != "") {
            this._configDescription.set_label(key.description);
        } else {
            this._configDescription.set_visible(false);
        }

        let index = 0;
        for (let childKey of key.data) {
            let container;
            if (childKey.type == 'expand') {
                container = new this(prefs, childKey);
            } else {
                container = new configItem.ConfigItem(prefs, childKey);
            }

            if (Gtk.MAJOR_VERSION == 4) {
                let row = new Gtk.ListBoxRow({
                    activatable: false,
                    selectable: false
                });
                row.set_child(container);

                this._configs.append(row);

                // Show list separator for GTK 4
                this._configs.set_show_separators(true);
            } else {
                // Add separator, if previous row is available
                if (index * 2 >= 1) { // we skip to 1 because it has separator added to the ui xml
                    let sep = new Gtk.Separator({ visible: true });
                    this._configs.add(sep);
                    let rowSep = this._configs.get_row_at_index(index * 2);
                    rowSep.set_activatable(false);
                }

                this._configs.insert(container, index * 2 +1);

                index++;
            }
        }
    }
});