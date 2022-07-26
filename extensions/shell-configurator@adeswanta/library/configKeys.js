/**
 * Extension Configuration Keys
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

// Define current GNOME Shell version
const shellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

/**
 * Collection of configuration keys.
 * NOTE: Don't modify this keys unless you want to add/modify it for development purposes.
 */
var keys = [
    {
        category: "main",
        displayName: _("Main"),
        configName: "configMain",
        description: _("Global/Generic configurations of the main shell"),
        supported: true,
        configs: [
            [
                'animation-speed', _('Animation Speed'),
                _("Shell animation speed factor"),
                'float', true, [0, 4, 0.25] // min, max, step
            ],
            [
                'startup-state', _('Startup State'),
                _("Shell startup state when session logged in"),
                'enum', shellVersion >= 40,
                [
                    ["DESKTOP", _("Desktop")],
                    ["OVERVIEW", _("Overview (Default)")],
                    ["APP_GRID", _("App Grid")]
                ]
            ]
        ]
    },
    {
        category: "panel",
        displayName: _("Panel"),
        configName: "configPanel",
        description: _("Your system control on the top of display"),
        supported: true,
        configs: [
            [
                'visibility', _('Visibility'),
                _("Show/Hide the panel"),
                'boolean', true, []
            ],
            [
                'auto-hide', _('Auto Hide'),
                _("Automatically hides the panel and show when cursor entered the panel"),
                'boolean', true, []
            ],
            [
                'show-on-overview', _('Show panel on overview'),
                _("When panel hiding, panel will be shown on overview"),
                'boolean', true, []
            ],
            [
                'elements', _('Panel Elements'),
                "",
                'expand', true, [
                    [
                        'activities-button-visibility', _('Activities Button Visibility'),
                        _("A button to enter to activities overview"),
                        'boolean', true, []
                    ],
                    [
                        'app-menu-visibility', _('App Menu Visibility'),
                        _("Application name indicator with menu of focused window"),
                        'boolean', true, []
                    ],
                    [
                        'date-time-menu-visibility', _('Date Time Menu Visibility'),
                        _("Showing date and time"),
                        'boolean', true, []
                    ],
                    [
                        'keyboard-layout-menu-visibility', _('Keyboard Layout Menu Visibility'),
                        _("Keyboard layout menu indicator and switching"),
                        'boolean', true, []
                    ],
                    [
                        'accessibility-menu-visibility', _('Accessibility Menu Visibility'),
                        _("An accessibility indicator"),
                        'boolean', true, []
                    ],
                    [
                        'system-menu-visibility', _('System Menu (Aggregate Menu) Visibility'),
                        _("A system menu showing power, volume, and network indicator"),
                        'boolean', true, []
                    ]
                ]
            ],
            [
                'height', _('Height'),
                _("Height size of the panel"),
                'int', true, [16, 128, 1] // min, max, step
            ],
            [
                'position', _('Position'),
                _("Move the panel position in vertical"),
                'enum', true,
                [
                    ["TOP", _("Top (Default)")],
                    ["BOTTOM", _("Bottom")]
                ]
            ]
        ]
    },
    {
        category: "dash",
        displayName: _("Dash"),
        configName: "configDash",
        description: _("Launches an application and favorites"),
        supported: true,
        configs: [
            [
                'visibility', _('Visibility'),
                _("Show/Hide Dash"),
                'boolean', true, []
            ],
            [
                'separator-visibility', _('Separator Visibility'),
                _("Show/Hide Dash separator that separates the favorite and running apps"),
                'boolean', shellVersion >= 40, []
            ],
            [
                'icon-size', _('Icon Size'),
                _("Fixed dash icon size. NOTE: when icon size is set to Auto, " +
                "you need restart gnome-shell to make changes"),
                'enum', true,
                [
                    ["AUTO", _("Auto (Default)")],
                    ["TINY", _("Tiny (16px)")],
                    ["SMALLER", _("Smaller (24px)")],
                    ["SMALL", _("Small (32px)")],
                    ["MEDIUM_SMALL", _("Medium-Small (48px)")],
                    ["MEDIUM", _("Medium (56px)")],
                    ["LARGE", _("Large (64px)")],
                    ["LARGER", _("Larger (72px)")],
                    ["BIGGER", _("Bigger (80px)")],
                    ["HUGE", _("Huge (96px)")],
                ]
            ],
            [
                'application-button', _('Show Application Button'),
                _("A button to show all applications from overview"),
                'expand', true, [
                    [
                        'visibility', _('Visibility'),
                        _("Show/Hide Application Button"),
                        'boolean', true, []
                    ],
                    [
                        'position', _('Position'),
                        _("Application Button Position either on top/left or bottom/right"),
                        'enum', true,
                        [
                            ["START", _("Start")],
                            ["END", _("End (Default)")]
                        ]
                    ]
                ]
            ]
        ]
    },
    {
        category: "overview",
        displayName: _("Overview"),
        configName: "configOverview",
        description: _("Your activities overview"),
        supported: shellVersion >= 40,
        configs: [
            [
                'static-desktop-background', _('Static Desktop Background on Overview'),
                _("Set overview background to desktop background"),
                'boolean', shellVersion >= 40, []
            ]
        ]
    },
    {
        category: "workspace",
        displayName: _("Workspace"),
        configName: "configWorkspace",
        description: _("Organize active windows"),
        supported: true,
        configs: [
            [
                'background-visibility', _('Workspace Background Visibility'),
                _("Show/Hide Workspace background visibility and disable workspace scaling"),
                'boolean', shellVersion >= 40, []
            ],
            [
                'background-uniform-scale', _('Keep Workspaces Background Scale Size'),
                _("Set the scale size of background workspaces to the same size as current workspace"),
                'boolean', shellVersion >= 40, [] // min, max, step
            ],
            [
                'switcher-visibility', _('Workspace Switcher Visibility'),
                _("Show/Hide Workspace switcher on the right/top of overview"),
                'boolean', true, []
            ],
            [
                'switcher-always-show', _('Always Show Workspace Switcher'),
                _("Always show the workspace switcher when there's only single workspace"),
                'boolean', shellVersion >= 40, []
            ],
            [
                'switcher-static-background', _('Static Background on Workspace Switcher'),
                _("Restore workspace switcher static background"),
                'boolean', shellVersion >= 40, []
            ],
            [
                'switcher-peak-width', _('Workspace Switcher Peak Width'),
                _("Peak width size of Workspace Switcher when it's in idle state"),
                'int', shellVersion <= 3.38, [-1, 96, 1] // min, max, step
            ],
            [
                'switcher-scale-size', _('Workspace Switcher Scale Size'),
                _("Maximum scale size of Workspace Switcher on the top of overview"),
                'int', shellVersion >= 40, [0, 10, 1] // min, max, step
            ],
            [
                'wraparound-switching', _('Workspace Wraparound Switching'),
                _("Enable wraparound switching of workspaces"),
                'boolean', true, []
            ],
            [
                'background-border-radius', _('Workspace Background Border Radius'),
                _("Border corner radius of Workspace background"),
                'int', shellVersion >= 40, [-1, 64, 1] // min, max, step
            ]
        ]
    },
    {
        category: "search",
        displayName: _("Search"),
        configName: "configSearch",
        description: _("The universal search from GNOME that easily search everything in computer"),
        supported: true,
        configs: [
            [
                'visibility', _('Visibility'),
                _("Show/Hide search entry on the top of overview"),
                'boolean', true, []
            ],
            [
                'type-to-search', _('Type to search behavior'),
                _("Triggers start search when user type on overview"),
                'boolean', true, []
            ]
        ]
    },
    {
        category: "appGrid",
        displayName: _("App Grid"),
        configName: "configAppGrid",
        description: _("Collection of Applications"),
        supported: true,
        configs: [
            [
                'rows', _('Row Size'),
                _("Row page size of App Grid"),
                'int', true, [2, 12, 1] // min, max, step
            ],
            [
                'columns', _('Column Size'),
                _("Column page size of App Grid"),
                'int', true, [2, 12, 1] // min, max, step
            ],
            [
                'double-super', _('Double Super to App Grid'),
                _("Enable double press super key to App Grid"),
                'boolean', shellVersion >= 40, [] // min, max, step
            ]
        ]
    },
    {
        category: "lookingGlass",
        displayName: _("Looking Glass"),
        configName: "configLookingGlass",
        description: _("Inspecting shell elements and debugging"),
        supported: true,
        configs: [
            [
                'horizontal-position', _('Horizontal Position (in %)'),
                _("Horizontal position of Looking Glass in percentage value"),
                'int', true, [0, 100, 1] // min, max, step
            ],
            [
                'vertical-position', _('Vertical Position'),
                _("Vertical position of Looking Glass"),
                'enum', true,
                [
                    ["TOP", _("Top (Default)")],
                    ["BOTTOM", _("Bottom")]
                ]
            ],
            [
                'width', _('Width Size'),
                _("Width size of Looking Glass"),
                'int', true, [0, 2048, 1] // min, max, step
            ],
            [
                'height', _('Height Size'),
                _("Height size of Looking Glass"),
                'int', true, [0, 2048, 1] // min, max, step
            ]
        ]
    },
    {
        category: "notification",
        displayName: _("Notification"),
        configName: "configNotification",
        description: _("A popup that displays a message to the user"),
        supported: true,
        configs: [
            [
                'banner-horizontal-position', _('Banner Horizontal Position'),
                _("Move the notification banner position in horizontal"),
                'enum', true,
                [
                    ["START", _("Start")],
                    ["CENTER", _("Center (Default)")],
                    ["END", _("End")]
                ]
            ],
            [
                'banner-vertical-position', _('Banner Vertical Position'),
                _("Move the notification banner position in vertical"),
                'enum', true,
                [
                    ["TOP", _("Top (Default)")],
                    ["BOTTOM", _("Bottom")]
                ]
            ],
            [
                'margin', _('Banner margin'),
                _("Margin size of notification banner"),
                'int', true, [0, 64, 1] // min, max, step
            ],
            [
                'timeout', _('Show timeout (in second)'),
                _("Show timeout after user triggering and idle"),
                'int', true, [0, 60, 1] // min, max, step
            ]
        ]
    },
    {
        category: "osd",
        displayName: _("OSD (On Screen Display)"),
        configName: "configOSD",
        description: _("On Screen Dialog that appears on the screen when system settings changes (such as volume, brightness, etc.)"),
        supported: true,
        configs: [
            [
                'horizontal-position', _('Horizontal Position'),
                _("Move the osd position in horizontal"),
                'enum', true,
                [
                    ["START", _("Start")],
                    ["CENTER", _("Center (Default)")],
                    ["END", _("End")]
                ]
            ],
            [
                'vertical-position', _('Vertical Position'),
                _("Move the osd position in vertical"),
                'enum', true,
                [
                    ["TOP", _("Top")],
                    ["CENTER", _("Center")],
                    ["BOTTOM", _("Bottom (Default)")]
                ]
            ]
        ]
    },
    {
        category: "screenshot",
        displayName: _("Screenshot UI"),
        configName: "configScreenshot",
        description: _("GNOME Screenshot Tool Built-In"),
        supported: shellVersion >= 42,
        configs: [
            [
                'dialog-vertical-position', _('Dialog Vertical Position'),
                _("Screenshot dialog position in vertical"),
                'enum', true,
                [
                    ["TOP", _("Top")],
                    ["BOTTOM", _("Bottom (Default)")]
                ]
            ]
        ]
    }
]