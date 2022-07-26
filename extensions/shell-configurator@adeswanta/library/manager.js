/**
 * SCManager
 * Components manager for Shell Configurator Settings
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

/**
 * SCKeys
 *
 * Components manager for Shell Configurator Settings
 */
var SCManager = class {
    /**
     * Class constructor
     */
    constructor(Self, Main, Settings, Libs, shellVersion) {
        this._Self = Self;

        // Shell Main
        this._Main = Main;

        // Declare GNOME Shell Version
        this._shellVersion = shellVersion;

        // Declare GSettings schema
        this._shellSettings = Settings['shellSettings'] || null;
        this._extensionSettings = Settings['extensionSettings'] || null;

        // Declare Libraries
        this._Misc = Libs['Misc'];
        this._Components = Libs['Components'];

        // imports required library and components
        this._main = this._Components.Main;
        this._panel = this._Components.Panel;
        this._dash = this._Components.Dash;
        this._overview = this._Components.Overview;
        this._workspace = this._Components.Workspace;
        this._search = this._Components.Search;
        this._appGrid = this._Components.AppGrid;
        this._lookingGlass = this._Components.LookingGlass;
        this._notification = this._Components.Notification;
        this._osd = this._Components.OSD;

        if (this._shellVersion >= 42) {
            this._screenshot = this._Components.Screenshot;
        }

        // Saves the current shell properties before the extension is start modifying them
        this._Components.backup();

        // Connect some signals and callbacks
        this._connectSignals();
        this._connectCallbacks();

        this._applyChanges();
    }

    /**
     * Revert and restore all GNOME Shell Components
     * @returns {void}
     */
    restore() {
        // Disconnect connected signals and callbacks
        this._disconnectSignals();
        this._disconnectCallbacks();

        // Set to previous shell properties when extension is disabled
        this._Components.restore();
    }

    /**
     * Remove used memory from the extension (in order not to make increasing memory)
     * @returns {void}
     */
    destroy() {
        delete(this._main);
        delete(this._panel);
        delete(this._dash);
        delete(this._overview);
        delete(this._workspace);
        delete(this._search);
        delete(this._appGrid);
        delete(this._lookingGlass);
        delete(this._notification);
        delete(this._osd);

        if (this._shellVersion >= 42) {
            delete(this._screenshot);
        }

        delete(this._Components);
        delete(this._Misc);

        delete(this._shellSettings);
        delete(this._extensionSettings);

        delete(this._shellVersion);

        delete(this._Main);

        delete(this._Self);
    }

    /**
     * Sets all shell properties from shell settings
     * @returns {void}
     */
    _applyChanges() {
        // Main
        this._main.animationSpeed(this._extensionSettings.get_double('main-animation-speed'));
        if (this._shellVersion >= 40) {
            this._main.startupState(this._extensionSettings.get_enum('main-startup-state'));
        }

        // Panel
        if (!this._extensionSettings.get_boolean('panel-auto-hide')) {
            this._panel.visibility(this._extensionSettings.get_boolean('panel-visibility'));
        }
        if (this._extensionSettings.get_boolean('panel-visibility')) {
            this._panel.autoHide(this._extensionSettings.get_boolean('panel-auto-hide'));
        }
        if (
            this._extensionSettings.get_boolean('panel-auto-hide') ||
            !this._extensionSettings.get_boolean('panel-visibility')
        ) {
            this._panel.showOnOverview(
                this._extensionSettings.get_boolean('panel-show-on-overview')
            );
        }
        this._panel.height(this._extensionSettings.get_int('panel-height'));
        this._panel.position(this._extensionSettings.get_enum('panel-position'));
        this._panel.elementVisibilityQueue(
            [
                [
                    'activities',
                    this._extensionSettings
                        .get_boolean('panel-elements-activities-button-visibility')
                ],
                [
                    'appMenu',
                    this._extensionSettings
                        .get_boolean('panel-elements-app-menu-visibility')
                ],
                [
                    'dateMenu',
                    this._extensionSettings
                        .get_boolean('panel-elements-date-time-menu-visibility')
                ],
                [
                    'keyboard',
                    this._extensionSettings
                        .get_boolean('panel-elements-keyboard-layout-menu-visibility')
                ],
                [
                    'a11y',
                    this._extensionSettings
                        .get_boolean('panel-elements-accessibility-menu-visibility')
                ]
                ,
                [
                    'aggregateMenu',
                    this._extensionSettings
                        .get_boolean('panel-elements-system-menu-visibility')
                ]
            ]
        )

        // Dash
        this._dash.visibility(this._extensionSettings.get_boolean('dash-visibility'));
        if (this._shellVersion >= 40) {
            this._dash.separatorVisibility(
                this._extensionSettings.get_boolean('dash-separator-visibility')
            );
        }
        this._dash.iconSize(this._extensionSettings.get_enum('dash-icon-size'));
        this._dash.applicationButtonVisibility(
            this._extensionSettings.get_boolean('dash-application-button-visibility')
        );
        this._dash.applicationButtonPosition(
            this._extensionSettings.get_enum('dash-application-button-position')
        );

        // Overview
        this._overview.staticDesktopBackground(
            this._extensionSettings.get_boolean('overview-static-desktop-background')
        );

        // Workspace
        this._workspace.switcherVisibility(
            this._extensionSettings.get_boolean('workspace-switcher-visibility')
        );
        if (this._shellVersion >= 40) {
            this._workspace.backgroundVisibility(
                this._extensionSettings.get_boolean('workspace-background-visibility')
            );
            this._workspace.backgroundUniformScale(
                this._extensionSettings.get_boolean('workspace-background-uniform-scale')
            );
            this._workspace.alwaysShowWorkspaceSwitcher(
                this._extensionSettings.get_boolean('workspace-switcher-always-show')
            );
            this._workspace.switcherStaticBackground(
                this._extensionSettings.get_boolean('workspace-switcher-static-background')
            );
            this._workspace.switcherScaleSize(
                this._extensionSettings.get_int('workspace-switcher-scale-size'),
                false
            );
            this._workspace.backgroundBorderRadius(
                this._extensionSettings.get_int('workspace-background-border-radius'),
                false
            );
        } else {
            this._workspace.switcherPeekWidth(
                this._extensionSettings.get_int('workspace-switcher-peak-width')
            );
        }
        this._workspace.wraparoundSwitching(
            this._extensionSettings.get_boolean('workspace-wraparound-switching')
        );

        // Search
        this._search.visibility(this._extensionSettings.get_boolean('search-visibility'));
        this._search.typeToSearch(this._extensionSettings.get_boolean('search-type-to-search'));

        // App Grid
        this._appGrid.rows(this._extensionSettings.get_int('appgrid-rows'));
        this._appGrid.columns(this._extensionSettings.get_int('appgrid-columns'));
        this._appGrid.doubleSuper(this._extensionSettings.get_boolean('appgrid-double-super'));

        // Looking Glass
        // Initiate the changes will revert back using Main.lookingGlass._resize()

        // Notification
        this._notification.horizontalBannerPosition(
            this._extensionSettings.get_enum('notification-banner-horizontal-position')
        );
        this._notification.verticalBannerPosition(
            this._extensionSettings.get_enum('notification-banner-vertical-position')
        );
        this._notification.timeout(this._extensionSettings.get_int('notification-timeout'));
        this._notification.margin(this._extensionSettings.get_int('notification-margin'));

        // OSD
        this._osd.horizontalPosition(this._extensionSettings.get_enum('osd-horizontal-position'));
        this._osd.verticalPosition(this._extensionSettings.get_enum('osd-vertical-position'));

        // Screenshot UI
        if (this._shellVersion >= 42) {
            this._screenshot.dialogVerticalPosition(
                this._extensionSettings.get_enum('screenshot-dialog-vertical-position')
            );
        }
    }

    /**
     * Connects all extension settings signals when user change the settings
     * @returns {void}
     */
    _connectSignals() {
        this._signals = [
            // Main (General)
            [
                this._extensionSettings.connect('changed::main-animation-speed', () => {
                    this._main.animationSpeed(
                        this._extensionSettings.get_double('main-animation-speed')
                    );
                }),
                this._extensionSettings.connect('changed::main-startup-state', () => {
                    if (this._shellVersion >= 40) {
                        this._main.startupState(
                            this._extensionSettings.get_enum('main-startup-state')
                        );
                    }
                })
            ],

            // Panel
            [
                this._extensionSettings.connect('changed::panel-visibility', () => {
                    this._panel.visibility(
                        this._extensionSettings.get_boolean('panel-visibility'),
                        this._extensionSettings.get_boolean('panel-show-on-overview')
                    );
                }),
                this._extensionSettings.connect('changed::panel-auto-hide', () => {
                    this._panel.autoHide(this._extensionSettings.get_boolean('panel-auto-hide'));

                    // Set auto hide state
                    this._panel.showOnOverview(
                        this._extensionSettings.get_boolean('panel-show-on-overview')
                    );
                }),
                this._extensionSettings.connect('changed::panel-show-on-overview', () => {
                    this._panel.showOnOverview(
                        this._extensionSettings.get_boolean('panel-show-on-overview')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-activities-button-visibility', () => {
                    this._panel.elementVisibility(
                        'activities',
                        this._extensionSettings
                            .get_boolean('panel-elements-activities-button-visibility')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-app-menu-visibility', () => {
                    this._panel.elementVisibility(
                        'appMenu',
                        this._extensionSettings
                            .get_boolean('panel-elements-app-menu-visibility')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-date-time-menu-visibility', () => {
                    this._panel.elementVisibility(
                        'dateMenu',
                        this._extensionSettings
                            .get_boolean('panel-elements-date-time-menu-visibility')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-keyboard-layout-menu-visibility', () => {
                    this._panel.elementVisibility(
                        'keyboard',
                        this._extensionSettings
                            .get_boolean('panel-elements-keyboard-layout-menu-visibility')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-accessibility-menu-visibility', () => {
                    this._panel.elementVisibility(
                        'a11y',
                        this._extensionSettings
                            .get_boolean('panel-elements-accessibility-menu-visibility')
                    );
                }),
                this._extensionSettings.connect(
                    'changed::panel-elements-system-menu-visibility', () => {
                    this._panel.elementVisibility(
                        'aggregateMenu',
                        this._extensionSettings
                            .get_boolean('panel-elements-system-menu-visibility')
                    );
                }),
                this._extensionSettings.connect('changed::panel-height', () => {
                    this._panel.height(this._extensionSettings.get_int('panel-height'), false);
                }),
                this._extensionSettings.connect('changed::panel-position', () => {
                    this._panel.position(this._extensionSettings.get_enum('panel-position'));

                    // Reset panel auto hide state
                    if (this._panel._autoHide) {
                        this._panel.autoHide(false, true);
                        this._panel.autoHide(
                            this._extensionSettings.get_boolean('panel-auto-hide'), true
                        );
                    }
                })
            ],

            // Dash
            [
                this._extensionSettings.connect('changed::dash-visibility', () => {
                    this._dash.visibility(this._extensionSettings.get_boolean('dash-visibility'));
                }),
                this._extensionSettings.connect('changed::dash-separator-visibility', () => {
                    if (this._shellVersion >= 40) {
                        this._dash.separatorVisibility(
                            this._extensionSettings.get_boolean('dash-separator-visibility')
                        );
                    }
                }),
                this._extensionSettings.connect('changed::dash-icon-size', () => {
                    this._dash.iconSize(this._extensionSettings.get_enum('dash-icon-size'));
                }),
                this._extensionSettings.connect(
                    'changed::dash-application-button-visibility', () => {
                        this._dash.applicationButtonVisibility(
                            this._extensionSettings
                                .get_boolean('dash-application-button-visibility')
                        );
                    }
                ),
                this._extensionSettings.connect('changed::dash-application-button-position', () => {
                    this._dash.applicationButtonPosition(
                        this._extensionSettings.get_enum('dash-application-button-position')
                    );
                })
            ],

            // Overview
            [
                this._extensionSettings.connect(
                    'changed::overview-static-desktop-background', () => {
                        if (this._shellVersion >= 40) {
                            this._overview.staticDesktopBackground(
                                this._extensionSettings
                                    .get_boolean('overview-static-desktop-background')
                            );
                        }
                    }
                )
            ],

            // Workspace
            [
                this._extensionSettings.connect('changed::workspace-background-visibility', () => {
                    if (this._shellVersion >= 40) {
                        this._workspace.backgroundVisibility(
                            this._extensionSettings.get_boolean('workspace-background-visibility')
                        );
                    }
                }),
                this._extensionSettings.connect('changed::workspace-background-uniform-scale',
                    () => {
                        if (this._shellVersion >= 40) {
                            this._workspace.backgroundUniformScale(
                                this._extensionSettings
                                    .get_boolean('workspace-background-uniform-scale')
                            );
                        }
                    }
                ),
                this._extensionSettings.connect('changed::workspace-switcher-visibility', () => {
                    this._workspace.switcherVisibility(
                        this._extensionSettings.get_boolean('workspace-switcher-visibility'),
                        (this._shellVersion >= 40) ?
                            this._extensionSettings.get_int('workspace-switcher-scale-size')
                        :   this._extensionSettings.get_int('workspace-switcher-peak-width')
                    );
                }),
                this._extensionSettings.connect('changed::workspace-switcher-always-show', () => {
                    if (this._shellVersion >= 40) {
                        this._workspace.alwaysShowWorkspaceSwitcher(
                            this._extensionSettings.get_boolean('workspace-switcher-always-show')
                        );
                    }
                }),
                this._extensionSettings.connect('changed::workspace-switcher-static-background',
                    () => {
                        if (this._shellVersion >= 40) {
                            this._workspace.switcherStaticBackground(
                                this._extensionSettings
                                    .get_boolean('workspace-switcher-static-background')
                            );
                        }
                    }
                ),
                this._extensionSettings.connect('changed::workspace-switcher-peak-width', () => {
                    if (this._shellVersion <= 3.38 &&
                        this._Misc.isExtensionEnabled(this._Self, this._shellSettings) &&
                        this._extensionSettings.get_boolean('workspace-switcher-visibility')
                    ) {
                        this._workspace.switcherPeekWidth(
                            this._extensionSettings.get_int('workspace-switcher-peak-width')
                        );
                    }
                }),
                this._extensionSettings.connect('changed::workspace-switcher-scale-size', () => {
                    if (this._shellVersion >= 40 &&
                        this._Misc.isExtensionEnabled(this._Self, this._shellSettings) &&
                        this._extensionSettings.get_boolean('workspace-switcher-visibility')
                    ) {
                        this._workspace.switcherScaleSize(
                            this._extensionSettings.get_int('workspace-switcher-scale-size')
                        );
                    }
                }),
                this._extensionSettings.connect('changed::workspace-wraparound-switching', () => {
                    this._workspace.wraparoundSwitching(
                        this._extensionSettings.get_boolean('workspace-wraparound-switching')
                    );
                }),
                this._extensionSettings.connect('changed::workspace-background-border-radius',
                    () => {
                        this._workspace.backgroundBorderRadius(
                            this._extensionSettings.get_int('workspace-background-border-radius')
                        );
                    }
                )
            ],

            // Search
            [
                this._extensionSettings.connect('changed::search-visibility', () => {
                    this._search
                        .visibility(this._extensionSettings.get_boolean('search-visibility'));
                }),
                this._extensionSettings.connect('changed::search-type-to-search', () => {
                    this._search
                        .typeToSearch(this._extensionSettings.get_boolean('search-type-to-search'));
                })
            ],

            // App Grid
            [
                this._extensionSettings.connect('changed::appgrid-rows', () => {
                    this._appGrid.rows(this._extensionSettings.get_int('appgrid-rows'));
                }),
                this._extensionSettings.connect('changed::appgrid-columns', () => {
                    this._appGrid.columns(this._extensionSettings.get_int('appgrid-columns'));
                }),
                this._extensionSettings.connect('changed::appgrid-double-super', () => {
                    this._appGrid.
                        doubleSuper(this._extensionSettings.get_boolean('appgrid-double-super'));
                })
            ],

            // Looking Glass
            // Note: It will changed when popup is shown

            // Notification
            [
                this._extensionSettings.connect(
                    'changed::notification-banner-horizontal-position', () => {
                        this._notification.horizontalBannerPosition(
                            this._extensionSettings
                                .get_enum('notification-banner-horizontal-position')
                        );
                    }
                ),
                this._extensionSettings.connect(
                    'changed::notification-banner-vertical-position', () => {
                        this._notification.verticalBannerPosition(
                            this._extensionSettings
                                .get_enum('notification-banner-vertical-position')
                        );
                    }
                ),
                this._extensionSettings.connect(
                    'changed::notification-timeout', () => {
                        this._notification
                            .timeout(this._extensionSettings.get_int('notification-timeout'));
                    }
                ),
                this._extensionSettings.connect(
                    'changed::notification-margin', () => {
                        this._notification
                            .margin(this._extensionSettings.get_int('notification-margin'));
                    }
                )
            ],

            // OSD
            [
                this._extensionSettings.connect(
                    'changed::osd-horizontal-position', () => {
                        this._osd.horizontalPosition(
                            this._extensionSettings.get_enum('osd-horizontal-position')
                        );
                    }
                ),
                this._extensionSettings.connect(
                    'changed::osd-vertical-position', () => {
                        this._osd.verticalPosition(
                            this._extensionSettings.get_enum('osd-vertical-position')
                        );
                    }
                )
            ],

            // Screenshot
            [
                this._extensionSettings.connect(
                    'changed::screenshot-dialog-vertical-position', () => {
                        if (this._shellVersion >= 42) {
                            this._screenshot.dialogVerticalPosition(
                                this._extensionSettings
                                    .get_enum('screenshot-dialog-vertical-position')
                            );
                        }
                    }
                )
            ]
        ];
    }

    /**
     * Disconnect all extension settings signals that prevent from user changes the settings
     * @returns {void}
     */
    _disconnectSignals() {
        for (let category of this._signals) {
            for (let signal of category) {
                this._extensionSettings.disconnect(signal);
            }
        }
        delete(this._signals);
    }

    /**
     * Connects all extension callbacks when other shell settings changed
     * @returns {void}
     */
    _connectCallbacks() {
        let panel = this._Main.panel;
        let lookingGlass = this._Main.lookingGlass;

        this._callbacks = [
            this._Main.layoutManager.connect("monitors-changed", () => {
                this._extensionSettings.set_int('panel-height', panel.height);
                this._panel.position(this._extensionSettings.get_enum('panel-position'));
            }),
            lookingGlass.connect('show', () => {
                // Change the looking glass configuration
                this._lookingGlass.horizontalPosition(
                    this._extensionSettings.get_int('lookingglass-horizontal-position')
                );
                this._lookingGlass.verticalPosition(
                    this._extensionSettings.get_enum('lookingglass-vertical-position')
                );
                this._lookingGlass.width(this._extensionSettings.get_int('lookingglass-width'));
                this._lookingGlass.height(this._extensionSettings.get_int('lookingglass-height'));
            }),
            lookingGlass.connect('hide', () => {
                // Make looking glass keep shown after inspecting shell elements
                this._lookingGlass.verticalPosition(
                    this._extensionSettings.get_enum('lookingglass-vertical-position')
                );
            })
        ]
    }

    /**
     * Disconnect all extension callbacks that prevent from shell changes the properties
     * @returns {void}
     */
    _disconnectCallbacks() {
        let lookingGlass = this._Main.lookingGlass

        this._Main.layoutManager.disconnect(this._callbacks[0]);
        lookingGlass.disconnect(this._callbacks[1]);
        lookingGlass.disconnect(this._callbacks[2]);

        delete(this._callbacks);
    }
}