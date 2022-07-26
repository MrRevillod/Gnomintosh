/**
 * Configuration Item Widget
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, GObject } = imports.gi;

/**
 * Configuration Item Widget
 */
var ConfigItem = GObject.registerClass({
    GTypeName: 'ConfigItem',
    Template: `file://${Self.dir.get_child('ui').get_path()}/config-item.ui`,
    InternalChildren: ['configName', 'configDescription', 'configSuffix']
}, class ConfigItem extends Gtk.Box {
    _init(prefs, key) {
        super._init({ name: key.id });

        this._configName.set_label(key.display);

        if (key.description) {
            this._configDescription.set_label(key.description);
        } else {
            this._configDescription.set_visible(false);
        }

        switch (key.type) {
            case 'boolean':
                this._configControl = new Gtk.Switch({name: key.id + '-state'});
                break;

            case 'int':
            case 'float':
                this._adjustment = new Gtk.Adjustment({
                    lower: key.data[0],
                    upper: key.data[1],
                    step_increment: key.data[2]
                });

                let spinButtonProps = {
                    name: key.id + '-size',
                    adjustment: this._adjustment
                }
                if (key.type == "float") {
                    spinButtonProps.digits = 2;
                }
                this._configControl = new Gtk.SpinButton(spinButtonProps);

                // Connect widget to emit focus within of entry (for GTK+ 3 only)
                let intFocusInID, intFocusOutID;

                if (Gtk.MAJOR_VERSION == 3) {
                    intFocusInID = this._configControl.connect('focus-in-event', () => {
                        prefs._isFocusWithinEntry = true;
                    })
                    intFocusOutID = this._configControl.connect('focus-out-event', () => {
                        prefs._isFocusWithinEntry = false;
                    })
                }

                this._configControl.connect('destroy', () => {
                    this._configControl.disconnect(intFocusInID);
                    this._configControl.disconnect(intFocusOutID);
                })

                if (Gtk.MAJOR_VERSION == 4) {
                    this._configControl.add_css_class('flat')
                } else {
                    this._configControl.get_style_context().add_class('flat');
                }

                break;

            case 'string':
                this._configControl = new Gtk.Entry({ name: key.id + '-value' });

                // Connect widget to emit focus within of entry (for GTK+ 3 only)
                let strFocusInID, strFocusOutID;

                if (Gtk.MAJOR_VERSION == 3) {
                    strFocusInID = this._configControl.connect('focus-in-event', () => {
                        prefs._isFocusWithinEntry = true;
                    })
                    strFocusOutID = this._configControl.connect('focus-out-event', () => {
                        prefs._isFocusWithinEntry = false;
                    })
                }

                this._configControl.connect('destroy', () => {
                    this._configControl.disconnect(strFocusInID);
                    this._configControl.disconnect(strFocusOutID);
                })

                break;

            case 'enum':
                this._configControl = new Gtk.ComboBoxText({ name: key.id + '-item' });

                for (let item of key.data) {
                    this._configControl.append(item[0], item[1]);
                }

                if (Gtk.MAJOR_VERSION == 4) {
                    // Make it flat (for GTK 4)
                    let toggleButton = this._configControl.get_first_child().get_first_child()
                    toggleButton.add_css_class('flat')
                }

                break;
        }
        this._configControl.set_visible(true);

        key.widget = this._configControl;

        if (Gtk.MAJOR_VERSION == 4) {
            this._configSuffix.append(this._configControl);
        } else {
            this._configSuffix.pack_start(this._configControl, false, true, 0);
        }
    }
});