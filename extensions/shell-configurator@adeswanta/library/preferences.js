/**
 * SCPrefs
 * The preferences library for Shell Configurator settings
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();

// Import gi libraries
const { Gtk, Gdk, GLib, GObject, Gio } = imports.gi;

// Translations
const Gettext = imports.gettext;
const Domain = Gettext.domain(Self.metadata['gettext-domain']);
const _ = Domain.gettext;

// Widgets
const {
    configItem,
    expandableConfigItem,
    moduleSection,
    searchResultItem,
    suggestedExtensionItem
} = Self.imports.widgets;

/**
 * SCPrefs
 *
 * The preferences library for Shell Configurator settings
 */
var SCPrefs = class {
    /**
     * Class constructor
     */
    constructor(Self, Libs, extensionSettings, shellVersion) {
        this._Self = Self;

        this._Keys = Libs['Keys'];
        this._Misc = Libs['Misc'];

        this._extensionSettings = extensionSettings;
        this._shellVersion = shellVersion;

        this._configKeys = Self.imports.library.configKeys.keys;

        this._isFocusWithinEntry = false;

        this._presetIsSetting = false;

        this._builder = new Gtk.Builder();
        this._releaseTypeLabel = "";

        this._searchWidgetResult = [];
        this._searchResultCategory = [];

        this._presetCombo = null;

        this._url = {
            'repository': 'https://gitlab.com/adeswantaTechs/shell-configurator',
            'references': 'https://gitlab.com/adeswantaTechs/shell-configurator/-/wikis/home',
            'bug_report': 'https://gitlab.com/adeswantaTechs/shell-configurator/-/issues'
        };
        this._presets = {
            "default": "Default",
            "minimal": "Minimal"
        };
    }

    /**
     * Check if this extension is in development
     * @returns {boolean}
     */
    _isDevelopment() {
        if (this._Self.metadata['release-state'] === 'development') {
            this._releaseTypeLabel = `\n(${_("Development Release")})`;
            return true;
        }

        // Leave empty when it's not a development release
        this._releaseTypeLabel = "";
        return false;
    }

    /**
     * Add the settings key that are save to keys object from keys.js
     * @returns {void}
     */
    _addKeys() {
        for (let category of this._configKeys) {
            this._Keys.addCategory(
                category.category,
                category.displayName,
                category.configName,
                category.description,
                category.supported
            );
            for (let config of category.configs) {
                this._Keys.addKey(
                    category.category,
                    config[0],  // name/id
                    config[1],  // displayName
                    config[2],  // description
                    config[3],  // type
                    config[4],  // supported
                    config[5],  // data
                    null        // widget
                );
            }
        }
    }

    /**
     * Check the preset name from these configurations
     * @returns {void}
     */
    _checkPreset() {
        let total = 0;
        let presetKeys = {};
        let match = {};
        let currentValues = {};
        let matchID = "custom"; // unmatched preset id

        for (let preset of Object.keys(this._presets)) {
            let presetFile = Gio.File.new_for_path(GLib.build_filenamev([
                this._Self.dir.get_child('presets').get_path(), `${preset}.json`
            ]));
            let [ok, contents, ] = presetFile.load_contents(null);

            if (ok) {
                presetKeys[preset] = JSON.parse(this._Misc.byteArrayToString(contents));
            } else {
                presetKeys[preset] = {};
            }

            match[preset] = 0;
        }

        let getCurrentValue = (key, values) => {
            let value;

            switch (key.type) {
                case 'boolean':
                    value = key.widget.get_active();
                    break;

                case 'int':
                    value = key.widget.get_value_as_int();
                    break;

                case 'float':
                    value = key.widget.get_value();
                    break;

                case 'enum':
                    if (this._shellVersion >= 42) {
                        for (let item of key.data) {
                            if (key.widget.get_selected_item().string == item[1]) {
                                value = item[0];
                            }
                        }
                    } else {
                        value = key.widget.get_active_id();
                    }
                    break;
            }

            if (key.type == 'expand') {
                values[key.name] = {};

                for (let childKey of Object.values(key.data)) {
                    if (key.supported) getCurrentValue(childKey, values[key.name]);
                }
            } else {
                values[key.name] = value;

                // Count total for non expand key type
                total++;
            }
        }

        for (let category of Object.values(this._Keys.getKeys())) {
            if (category.supported) {
                currentValues[category.category] = {};
                for (let key of Object.values(category["configs"])) {
                    if (key.supported) {
                        getCurrentValue(key, currentValues[category.category]);
                    }
                }
            }
        }

        let checkPerKey = (key, presetName, currentValue, presetValue) => {
            if (key.type != 'expand') {
                let isMatch = (currentValue[key.name] == presetValue[key.name]);
                match[presetName] += isMatch ? 1 : 0;
            } else {
                for (let childKey of Object.values(key.data)) {
                    if (key.supported) {
                        checkPerKey(
                            childKey, presetName, currentValue[key.name], presetValue[key.name]
                        );
                    }
                }
            }
        }


        for (let category of Object.values(this._Keys.getKeys())) {
            if (category.supported) {
                for (let key of Object.values(category["configs"])) {
                    if (key.supported) {
                        for (let preset of Object.keys(this._presets)) {
                            checkPerKey(
                                key, preset,
                                currentValues[key.category],
                                presetKeys[preset]["configs"][key.category]
                            );
                        }
                    }
                }
            }
        }

        for (let preset of Object.keys(this._presets)) {
            matchID = (match[preset] == total) ? preset : matchID;
        }

        if (!this._presetIsSetting) this._presetCombo.set_active_id(matchID);
    }

    /**
     * Set the config preset from available presets
     * @param {string} name preset name
     * @returns {void}
     */
    _setPreset(name) {
        // Leave the custom preset
        if (name == "custom") { return; }

        let presetConfigs, presetEnums;

        // Get the preset file and parse it
        let presetFile = Gio.File.new_for_path(GLib.build_filenamev([
            this._Self.dir.get_child('presets').get_path(), `${name}.json`
        ]));
        let [ok, contents, ] = presetFile.load_contents(null);
        presetConfigs = JSON.parse(this._Misc.byteArrayToString(contents));

        // Get the preset enums file and parse it
        let presetEnumFile = Gio.File.new_for_path(GLib.build_filenamev([
            this._Self.dir.get_child('presets').get_path(), "_enums.json"
        ]));
        [, contents, ] = presetEnumFile.load_contents(null);
        presetEnums = JSON.parse(this._Misc.byteArrayToString(contents));

        let setPresetPerKey = (key, value) => {
            if (key.supported) {
                switch (key.type) {
                    case 'boolean':
                        this._extensionSettings.set_boolean(key.schemaID, value);
                        break;

                    case 'int':
                        this._extensionSettings.set_int(key.schemaID, value);
                        break;

                    case 'float':
                        this._extensionSettings.set_double(key.schemaID, value);
                        break;


                    case 'enum':value
                        this._extensionSettings.set_enum(
                            key.schemaID, presetEnums[key.schemaID][value]
                        );
                        break;

                    case 'expand':
                        for (let childKey of Object.values(key.data)) {
                            setPresetPerKey(childKey, value[childKey.name]);
                        }
                        break;
                }
            }
        };

        // Do when loading preset file contents are successful loaded
        if (ok) {
            this._presetIsSetting = true;

            for (let category of Object.values(this._Keys.getKeys())) {
                if (category.supported) {
                    for (let key of Object.values(category["configs"])) {
                        if (key.supported) {
                            if (presetConfigs["configs"][key.category]) {
                                setPresetPerKey(
                                    key, presetConfigs["configs"][key.category][key.name]
                                );
                            } else {
                                throw new Warning(
                                    `Preset of ${key.category} is not available. ` +
                                    "some configuration may not be applied."
                                );
                            }
                        }
                    }
                }
            }

            this._presetIsSetting = false;
        }
    }

    /**
     * Search function for searching configuration
     * @param {string} [data] search data
     * @returns {void}
     */
    _searchConfig(data = "") {
        // option result list widget
        let configResult = this._builder.get_object("configResult");

        // Remove previous result data
        if (Gtk.MAJOR_VERSION == 4) {
            for (let item of this._searchWidgetResult) {
                configResult.remove(item);
            }
        } else {
            for (let item of configResult.get_children()) {
                configResult.remove(item);
            }
        }

        this._searchWidgetResult = [];
        this._searchResultCategory = [];

        let index = 0

        let checkValidSearch = (configs, category) => {
            for (let key of configs) {
                let isValid =
                    ((data == "") || (
                        // The item will shown if config is supported and config data (id, display,
                        // and description) is match/included with substring of search data
                        key.id.replace('-', ' ').toLowerCase().includes(data.toLowerCase()) ||
                        key.display.toLowerCase().includes(data.toLowerCase()) ||
                        key.description.toLowerCase().includes(data.toLowerCase())
                    )) && key.supported && key.type != "expand";
                if (isValid) {
                    // create an item
                    let container = new searchResultItem.SearchResultItem(
                        key.display,
                        `${category.displayName}`
                    )

                    if (Gtk.MAJOR_VERSION == 4) {
                        let item = new Gtk.ListBoxRow({
                            selectable: false
                        });
                        item.set_child(container);
                        configResult.append(item);
                        this._searchWidgetResult.push(item);
                    } else {
                        configResult.insert(container, index);
                        this._searchWidgetResult.push(container);
                        index++;
                    }

                    if (key.widget) {
                        // Set container row to use to focus the row
                        // widget -> box -> row
                        container._row = key.widget.get_parent().get_parent().get_parent();
                    }

                    // Push the result data
                    this._searchResultCategory.push(category.configName);
                }
            }
        }

        for (let category of Object.values(this._Keys.getKeys())) {
            if (category.supported) {
                checkValidSearch(Object.values(category["configs"]), category);
            }
        }
        // Hide config result list if result data is empty
        configResult.get_parent().set_visible(!this._searchWidgetResult.length == 0)
    }

    _connectConfigurationSignals(keys) {
        for (let key of Object.values(keys)) {
            if (key.supported) {
                switch (key.type) {
                    case 'boolean':
                        this._extensionSettings.bind(
                            key.schemaID,
                            key.widget, 'active',
                            Gio.SettingsBindFlags. DEFAULT
                        );

                        key.widget.connect("state-set", () => {
                            this._checkState();
                            this._checkPreset();
                        })
                        break;

                    case 'int':
                    case 'float':
                        this._extensionSettings.bind(
                            key.schemaID,
                            key.widget, 'value',
                            Gio.SettingsBindFlags. DEFAULT
                        );

                        key.widget.connect("value-changed", () => {
                            this._checkState();
                            this._checkPreset();
                        })
                        break;

                    case 'enum':
                        if (this._shellVersion >= 42) {
                            key.widget.connect("notify::selected", (out) => {
                                this._extensionSettings.set_enum(key.schemaID, out.get_selected());
                                this._checkState();
                                this._checkPreset();
                            });

                            key.widget.set_selected(this._extensionSettings.get_enum(key.schemaID));

                            this._extensionSettings.connect(`changed::${key.schemaID}`, () => {
                                key.widget.set_selected(
                                    this._extensionSettings.get_enum(key.schemaID)
                                );
                            })
                        } else {
                            this._extensionSettings.bind(
                                key.schemaID,
                                key.widget, 'active-id',
                                Gio.SettingsBindFlags. DEFAULT
                            );

                            key.widget.connect("notify::selected-item", () => {
                                this._checkState();
                                this._checkPreset();
                            })
                        }
                        break;

                    case 'expand':
                        this._connectConfigurationSignals(key.data);
                }
            }
        }
    }

    /**
     * Connect settings signals when user triggering widget signals on prefs
     * @param {*} window preferences window
     * @returns {void}
     */
    _connectSignals(window) {
        // Connect configuration signals
        for (let category of Object.values(this._Keys.getKeys())) {
            if (category.supported) {
                this._connectConfigurationSignals(category["configs"]);
            }
        }

        // Connect menu signals
        this._builder.get_object('linkExtensionWebsite').connect(
            "clicked", () => this._openURI(window, this._url.repository)
        );
        this._builder.get_object('linkExtensionReferences').connect(
            "clicked", () => this._openURI(window, this._url.references)
        );
        this._builder.get_object('linkExtensionReportBug').connect(
            "clicked", () => this._openURI(window, this._url.bug_report)
        );

        if (this._shellVersion <= 41) {
            // Search function
            let searchButton = this._builder.get_object('searchButton');
            let searchEntry = this._builder.get_object('searchEntry');
            let searchBar = this._builder.get_object('searchBar');
            let searchPage = this._builder.get_object('searchPage');

            searchEntry.connect("changed", (w) => {
                this._searchConfig(w.get_text());
                if (this._searchWidgetResult.length == 0 && w.get_text() != "")
                    searchPage.set_visible_child_name("searchNotFound");
                else
                    searchPage.set_visible_child_name("searchAvailable");
            })

            let triggerSearch = () => {
                let mainStack = this._builder.get_object('mainStack');
                if (searchButton.get_active()) {
                    mainStack.set_visible_child_name("searchPage");
                } else {
                    mainStack.set_visible_child_name("contentPage");
                }
                this._searchConfig(searchEntry.get_text() || "");
            }
            searchButton.connect("toggled", triggerSearch);

            searchButton.bind_property(
                'active',
                searchBar,
                'search-mode-enabled',
                GObject.BindingFlags.BIDIRECTIONAL
            );

            if (Gtk.MAJOR_VERSION == 4) {
                searchBar.set_key_capture_widget(window);
            } else {
                window.connect('key-press-event', (win, event) => {
                    if (!this._isFocusWithinEntry) return searchBar.handle_event(event);
                });
            }

            searchBar.connect_entry(searchEntry);

            // search result item signal
            let configResult = this._builder.get_object("configResult")
            configResult.connect("row-activated", (list, listRow) => {
                let mainStack = this._builder.get_object('mainStack');
                mainStack.set_visible_child_name("contentPage");

                let contentStack = this._builder.get_object('contentStack');
                contentStack.set_visible_child_name("configPage");

                searchButton.set_active(false);
                searchBar.set_search_mode(false);

                // Focus to ListBoxRow
                listRow.get_child()._row.grab_focus();
            });
        }
    }

    /**
     * Open the URL to the browser
     * @param {*} window preferences window
     * @param {string} uri url link
     * @returns {void}
     */
    _openURI(window, uri) {
        if (this._shellVersion >= 40)
            Gtk.show_uri(window, uri, Gdk.CURRENT_TIME);
        else
            Gtk.show_uri_on_window(window, uri, Gdk.CURRENT_TIME);
    }

    /**
     * Check state for certain configurations
     * @returns {void}
     */
    _checkState() {
        let panelVisibility = this._Keys.getKeys().panel.configs["panel-visibility"].widget;
        let panelShowOnOverview =
            this._Keys.getKeys().panel.configs["panel-show_on_overview"].widget;
        this._Keys.getKeys().panel.configs["panel-height"].widget
            .set_sensitive((panelVisibility.get_active() || panelShowOnOverview.get_active()));
        this._Keys.getKeys().panel.configs["panel-auto_hide"].widget
            .set_sensitive(panelVisibility.get_active());

        let panelAutoHide = this._Keys.getKeys().panel.configs["panel-auto_hide"].widget;
        this._Keys.getKeys().panel.configs["panel-visibility"].widget
            .set_sensitive(!panelAutoHide.get_active());

        this._Keys.getKeys().panel.configs["panel-show_on_overview"].widget
            .set_sensitive(!panelVisibility.get_active() || panelAutoHide.get_active());
    }

    /**
     * Fixing ui elements
     * @param {*} window preferences window
     * @returns {void}
     */
    _fixUI(window) {
        let window_size = [720, 480]
        window.default_width = window_size[0];
        window.default_height = window_size[1];

        if (Gtk.MAJOR_VERSION == 4) {
            // Add home cover image
            let coverImage = Gtk.Picture.new_for_filename(
                this._Self.dir.get_child('image').get_path() + "/gnome-shell.png"
            );
            coverImage.set_size_request(-1, 240)
            this._builder.get_object('coverImage').append(coverImage);

            // Add logo
            let logoImage = Gtk.Picture.new_for_filename(
                this._Self.dir.get_child('image').get_path() + "/sc-logo.png"
            );
            logoImage.set_size_request(-1, 96)
            this._builder.get_object('logoImage').append(logoImage);

            // Set scroll to focused widget for configPageView (Gtk.Viewport)
            let configPageView = this._builder.get_object('configPageView');
            configPageView.set_scroll_to_focus(true);
        } else {
            this._builder.get_object("headerBar").set_title('Shell Configurator');
            this._builder.get_object("headerBar").set_show_close_button(true);
            window.set_size_request(window_size[0], window_size[1]);
            window.resize(`${window_size[0]}`, `${window_size[1]}`);

            // Add home cover image
            let coverImage = Gtk.Image.new_from_file(
                this._Self.dir.get_child('image').get_path() + "/gnome-shell.png"
            );
            coverImage.set_visible(true);
            coverImage.set_pixel_size(240);
            this._builder.get_object('coverImage').pack_start(coverImage, false, false, 0);

            // Add logo
            let logoImage = Gtk.Image.new_from_file(
                this._Self.dir.get_child('image').get_path() + "/sc-logo.png"
            );
            logoImage.set_visible(true);
            this._builder.get_object('logoImage').pack_start(logoImage, false, false, 0);
        }
    }

    _createConfigurationRow(key) {
        let row;
        if (this._shellVersion >= 42) {
            const Adw = imports.gi.Adw;
            let widget;
            switch (key.type) {
                case 'boolean':
                    widget = new Gtk.Switch({ valign: Gtk.Align.CENTER });
                    row = new Adw.ActionRow({
                        name: key.id + '-state',
                        title: key.display,
                        subtitle: key.description,
                        activatable_widget: widget
                    });
                    row.add_suffix(widget);
                    break;

                case 'int':
                case 'float':
                    let adjustment = new Gtk.Adjustment({
                        lower: key.data[0],
                        upper: key.data[1],
                        step_increment: key.data[2]
                    });

                    let spinButtonProps = {
                        adjustment: adjustment,
                        valign: Gtk.Align.CENTER
                    }
                    if (key.type == "float") {
                        spinButtonProps.digits = 2;
                    }
                    widget = new Gtk.SpinButton(spinButtonProps);

                    if (Gtk.MAJOR_VERSION == 4)
                        widget.add_css_class('flat')
                    else
                        widget.get_style_context().add_class('flat')

                    row = new Adw.ActionRow({
                        name: key.id + '-size',
                        title: key.display,
                        subtitle: key.description,
                        activatable_widget: widget
                    });
                    row.add_suffix(widget);
                    break;

                case 'string':
                    widget = new Gtk.Entry({ valign: Gtk.Align.CENTER });
                    row = new Adw.ActionRow({
                        name: key.id + '-value',
                        title: key.display,
                        subtitle: key.description,
                        activatable_widget: widget
                    });
                    row.add_suffix(widget);
                    break;

                case 'enum':
                    let stringList = new Gtk.StringList();
                    row = new Adw.ComboRow({
                        name: key.id + '-item',
                        title: key.display,
                        subtitle: key.description,
                        model: stringList
                    });
                    widget = row;
                    for (let item of key.data) {
                        stringList.append(item[1]);
                    }
                    break;

                case 'expand':
                    row = new Adw.ExpanderRow({
                        name: key.id + '-item',
                        title: key.display,
                        subtitle: key.description
                    });
                    widget = row;
                    break;
            }
            key["widget"] = widget;
        } else {
            if (key.type == 'expand') {
                row = new expandableConfigItem.ExpandableConfigItem(this, key);
            } else {
                row = new configItem.ConfigItem(this, key);
            }
        }
        return row;
    }

    /**
     * Generate suggested extension data from json file
     * @returns {Array}
     */
    _generateSuggestedExtensionsData() {
        let jsonFile = Gio.File.new_for_path(GLib.build_filenamev([
            this._Self.dir.get_path(), 'suggested-extensions.json'
        ]));
        let [ok, contents, ] = jsonFile.load_contents(null);

        if (ok) {
            return JSON.parse(this._Misc.byteArrayToString(contents)).extensions;
        }
    }

    /**
     * Add preferences pages
     * @param {Gtk.Window | Adw.PreferencesWindow} window preferences content window
     * @param {Gtk.Stack} content preferences content stack
     * @returns {void}
     */
    _addPages(window, content) {
        if (this._shellVersion >= 42) {
            const Adw = imports.gi.Adw;

            // Content page
            let welcomePage = new Adw.PreferencesPage();
            welcomePage.set_title(_('Home'));
            welcomePage.set_name('welcomePage');
            welcomePage.set_icon_name('go-home-symbolic');

            let welcomeContainer = new Adw.PreferencesGroup({
                vexpand: true,
                valign: Gtk.Align.CENTER
            });
            welcomeContainer.add(this._builder.get_object('welcomePage'))

            welcomePage.add(welcomeContainer)
            content.add(welcomePage);


            // Configuration Page
            let configPage = new Adw.PreferencesPage();
            configPage.set_title(_('Configurations'));
            configPage.set_name('configPage');
            configPage.set_icon_name('emblem-system-symbolic');


            // Preset Section
            let presetGroup = new Adw.PreferencesGroup();
            let presetBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                halign: Gtk.Align.CENTER,
                spacing: 8,
                width_request: 560
            });
            let presetLabel = new Gtk.Label({
                label: 'Configuration Preset:',
            });

            this._presetCombo = new Gtk.ComboBoxText({
                hexpand: true
            });

            for (let [id, text] of Object.entries(this._presets)) {
                this._presetCombo.append(id, text);
            }

            this._presetCombo.append("custom", _("Custom"));
            this._presetCombo.connect('changed', () => {
                this._setPreset(this._presetCombo.get_active_id());
            })
            presetBox.append(presetLabel);
            presetBox.append(this._presetCombo);

            presetGroup.add(presetBox)
            configPage.add(presetGroup);


            // Module Pages
            for (let category of Object.values(this._Keys.getKeys())) {
                if (category.supported) {
                    let container = new Adw.PreferencesGroup({
                        title: category.displayName,
                        description: category.description
                    });

                    for (let key of Object.values(category["configs"])) {
                        if (key.supported) {
                            let row = this._createConfigurationRow(key);

                            if (key.type == 'expand') {
                                for (let childKey of key.data) {
                                    let rowChild = this._createConfigurationRow(childKey);
                                    row.add_row(rowChild);
                                }
                            }
                            container.add(row);
                        }
                    };

                    configPage.add(container);
                }
            }
            content.add(configPage);


            // Suggested page
            let suggestedPage = new Adw.PreferencesPage();
            suggestedPage.set_title(_('Suggested'));
            suggestedPage.set_name('suggestedPage');
            suggestedPage.set_icon_name('emblem-ok-symbolic');

            let container = new Adw.PreferencesGroup({
                title: _("Suggested Extensions"),
                description: _("Some alternative features that already included on these extensions")
            });

            for (let key of this._generateSuggestedExtensionsData()) {
                if (key.name || key.ability || key.uri) {
                    let box = new Gtk.Box({
                        orientation: Gtk.Orientation.HORIZONTAL,
                        spacing: 8
                    });

                    let label = new Gtk.Label({ label: `${_("Install")} ${key.name}` })
                    box.append(label);

                    let icon = new Gtk.Image({ icon_name: 'go-next-symbolic' })
                    box.append(icon);

                    let widget = new Gtk.Button({ valign: Gtk.Align.CENTER });
                    widget.add_css_class('flat');
                    widget.connect('clicked', () => this._openURI(window, key.uri));
                    widget.set_child(box);
                    let row = new Adw.ActionRow({
                        title: key.name,
                        subtitle: `${_("Can do:")} ${key.ability}`,
                        activatable_widget: widget
                    });

                    row.add_suffix(widget);
                    container.add(row);
                }
            };

            suggestedPage.add(container);
            content.add(suggestedPage);


            // About page
            let aboutPage = new Adw.PreferencesPage();
            aboutPage.set_title(_('About'));
            aboutPage.set_name('aboutPage');
            aboutPage.set_icon_name('dialog-information-symbolic');

            let aboutContainer = new Adw.PreferencesGroup({
                vexpand: true,
                valign: Gtk.Align.CENTER
            });
            aboutContainer.add(this._builder.get_object('aboutPage'))

            aboutPage.add(aboutContainer)
            content.add(aboutPage);
        } else {
            // Content page
            let contentStack = this._builder.get_object('contentStack');
            content.add_named(contentStack, "contentPage");


            // Welcome page
            let welcomePage = this._builder.get_object('welcomePage');
            contentStack.add_titled(welcomePage, "welcomePage", _("Home"));


            // Configuration Page
            let configPage = this._builder.get_object('configPage');
            contentStack.add_titled(configPage, "configPage", _("Configurations"));


            // Add presets entries
            this._presetCombo = this._builder.get_object('presetCombo');

            for (let [id, text] of Object.entries(this._presets)) {
                this._presetCombo.append(id, text);
            }

            this._presetCombo.append("custom", _("Custom"));
            this._presetCombo.connect('changed', () => {
                this._setPreset(this._presetCombo.get_active_id());
            })


            // Module Pages
            for (let category of Object.values(this._Keys.getKeys())) {
                if (category.supported) {
                    let page = new moduleSection.ModuleSection(
                        category["configName"],
                        category["displayName"],
                        category["description"]
                    );

                    let index = 0
                    for (let key of Object.values(category["configs"])) {
                        if (key.supported) {
                            let container = this._createConfigurationRow(key);
                            if (Gtk.MAJOR_VERSION == 4) {
                                let item = new Gtk.ListBoxRow({
                                    activatable: false,
                                    selectable: false
                                });
                                item.set_child(container);
                                page._configs.append(item);

                                // Show list separator for GTK 4
                                page._configs.set_show_separators(true);
                            } else {
                                // Add separator, if previous row is available
                                if (index * 2 - 1 >= 0) {
                                    let sep = new Gtk.Separator({ visible: true });
                                    page._configs.add(sep);
                                    let rowSep = page._configs.get_row_at_index(index * 2 - 1);
                                    rowSep.set_activatable(false);
                                }

                                page._configs.insert(container, index * 2);

                                index++;
                            }
                            key["widget"] = container._configControl;
                        }
                    };

                    let moduleSections = this._builder.get_object('modules');
                    if (Gtk.MAJOR_VERSION == 4)
                        moduleSections.append(page);
                    else
                        moduleSections.pack_start(page, false, true, 0);
                }
            }


            // Suggested page
            let suggestedPage = this._builder.get_object('suggestedPage');
            contentStack.add_titled(suggestedPage, "suggestedPage", _("Suggested"));

            let index = 0;
            for (let key of this._generateSuggestedExtensionsData()) {
                if (key.name || key.ability || key.uri) {
                    let container
                        = new suggestedExtensionItem.SuggestedExtensionItem(this, window, key);
                    let listBox = this._builder.get_object('extensions');
                    if (Gtk.MAJOR_VERSION == 4) {
                        let item = new Gtk.ListBoxRow({
                            activatable: false,
                            selectable: false
                        });
                        item.set_child(container);
                        listBox.append(item);

                        // Show list separator for GTK 4
                        listBox.set_show_separators(true);
                    } else {
                        // Add separator, if previous row is available
                        if (index * 2 - 1 >= 0) {
                            let sep = new Gtk.Separator({ visible: true });
                            listBox.add(sep);
                            let rowSep = listBox.get_row_at_index(index * 2 - 1);
                            rowSep.set_activatable(false);
                        }

                        listBox.insert(container, index * 2);

                        index++;
                    }
                }
            };


            // About page
            let aboutPage = this._builder.get_object('aboutPage');
            contentStack.add_titled(aboutPage, "aboutPage", _("About"));


            // Search page
            let searchPage = this._builder.get_object('searchPage');
            searchPage.add_named(
                this._builder.get_object('searchAvailable'), "searchAvailable"
            );
            searchPage.add_named(
                this._builder.get_object('searchNotFound'), "searchNotFound"
            );
            content.add_named(searchPage, "searchPage");
        }
    }

    /**
     * Creates and build prefs UI and return to content widget which is use for buildPrefsWidget
     * on prefs.js
     * @param {*} [window] preferences window
     * @returns {void}
     */
    buildUI(window = null) {
        // Set translation domain
        this._builder.set_translation_domain("shell-configurator");

        // Adding preferences ui file
        let uiFiles = [
            "window",
            "welcome-page",
            "config-page",
            "about-page",
            "search-page",
            "suggested-extension-page"
        ];
        for (let ui of uiFiles) {
            this._builder.add_from_file(
                `${this._Self.dir.get_child('ui').get_path()}/${ui}.ui`
            );
        }

        let windowContent; // for GNOME 41 below only

        if (this._shellVersion >= 42) {
            // Development window style
            if (this._isDevelopment(this._Self)) window.add_css_class('devel');

            // Fix the UI
            this._fixUI(window);

            // Enable search feature (built-in)
            window.search_enabled = true;

            // Reset all keys
            this._Keys.resetEmpty();

            // Add prefs keys
            this._addKeys();

            // Add preferences pages
            this._addPages(window, window);

            // Connect Signals
            this._connectSignals(window);

            // Check configuration state
            this._checkState();

            // Check preset
            this._checkPreset();
        } else {
            // Get content widget
            windowContent = this._builder.get_object('windowContent');

            // Connect content realize signal for window customization
            windowContent.connect('realize', () => {
                // Window configuration
                let window = (Gtk.MAJOR_VERSION == 4) ? windowContent.get_root() : windowContent.get_toplevel();

                // Header bar configuration for GNOME 41 below
                if (this._shellVersion <= 41) {
                    let stackSwitcher = this._builder.get_object('stackSwitcher');
                    let headerBar = this._builder.get_object("headerBar");

                    // Add title widget to header bar
                    if ((Gtk.MAJOR_VERSION == 4))
                        headerBar.set_title_widget(stackSwitcher);
                    else
                        headerBar.set_custom_title(stackSwitcher);

                    window.set_titlebar(headerBar);
                }

                // Development window style
                if (this._isDevelopment()) {
                    if (Gtk.MAJOR_VERSION == 4)
                        window.add_css_class('devel')
                    else
                        window.get_style_context().add_class('devel')
                }

                // Add Pages
                let mainStack = this._builder.get_object('mainStack');
                this._addPages(window, mainStack);

                // Set stack for sidebar
                let contentStack = this._builder.get_object('contentStack');
                this._builder.get_object('stackSwitcher').set_stack(contentStack);

                // Connect Signals
                this._connectSignals(window);

                // Check configuration state
                this._checkState();

                // Check preset
                this._checkPreset();

                // Fix the UI
                this._fixUI(window);
            });

            // Reset all keys
            this._Keys.resetEmpty();

            // Add prefs keys
            this._addKeys();
        }


        // Set GNOME Shell version label
        this._builder.get_object('shellVersionLabel').set_text(
            `${_("Current GNOME Shell Version")}: ` +
            ((this._shellVersion >= 40) ?
                this._shellVersion.toFixed(1)
            :   this._shellVersion.toFixed(2))
        );

        // Check if extension is in development, if true, make development message visible
        if (this._isDevelopment()) this._builder.get_object('developmentMessage').set_visible(true);

        // Set extension version text
        let versionText = `${_("Version")} ${this._Self.metadata['version']}`;
        if (this._isDevelopment()) {
            versionText +=
                ` - ${_("Codename")} ${this._Self.metadata['codename']}` +
                `\n${_("Development Release")}`;
        }

        // Set the version label
        this._builder.get_object('versionLabel').set_text(versionText);

        // Returning content widget (for GNOME 41 below)
        if (this._shellVersion <= 41) return windowContent;
    }
}