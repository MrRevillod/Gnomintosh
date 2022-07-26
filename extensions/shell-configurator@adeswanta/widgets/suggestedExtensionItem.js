/**
 * Suggested Extension Item Widget
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, GObject } = imports.gi;

// Translations
const Gettext = imports.gettext;
const Domain = Gettext.domain(Self.metadata['gettext-domain']);
const _ = Domain.gettext;

/**
 * Suggested Extension Item Widget
 */
var SuggestedExtensionItem = GObject.registerClass({
    GTypeName: 'SuggestedExtensionItem',
    Template: `file://${Self.dir.get_child('ui').get_path()}/suggested-extension-item.ui`,
    InternalChildren: ['suggestedName', 'suggestedAbility', 'suggestedButton']
}, class SuggestedExtensionItem extends Gtk.Box {
    _init(prefs, window, key) {
        super._init();

        this._suggestedName.set_label(key.name);
        this._suggestedAbility.set_label(`${_("Can do:")} ${key.ability}`);
        this._suggestedButton.set_label(`${_("Install")} ${key.name}`);
        this._suggestedButton.connect('clicked', () => prefs._openURI(window, key.uri));
    }
});