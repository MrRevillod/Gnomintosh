/**
 * Main Module
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    schema:Schema,
    misc:Misc,
} = Self.imports.library;
const template = Self.imports.library.modules._template;

const MAIN_STARTUP_STATE = {
    DESKTOP: 0,
    OVERVIEW: 1,
    APP_GRID: 2
}

/**
 * Main
 *
 * Global/Generic configurations of the main shell
 *
 * This Module can configure/do:
 * > Set the animation speed
 * > Set the startup state (GNOME 40 above)
 */
var MainModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._St = imports.gi.St || null;
        this._GLib = imports.gi.GLib || null;

        // Schemas
        this._desktopInterfaceSchema = Schema.newSchema('org.gnome.desktop.interface');

        // UI libraries
        this._OverviewControls = imports.ui.overviewControls || null;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'animationSpeed': this._St.Settings.get().slow_down_factor,
            'startupState':
                (this._shellVersion >= 40) ?
                    MAIN_STARTUP_STATE.OVERVIEW
                :   null,
            '_enableAnimations': this._desktopInterfaceSchema.get_boolean('enable-animations'),
            '_hasOverview': this._Main.sessionMode.hasOverview,
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.animationSpeed(this._origin['animationSpeed'], true);
        if (this._shellVersion >= 40) {
            this.startupState(MAIN_STARTUP_STATE.OVERVIEW);
        }
    }

    /**
     * Animation speed
     * @param {number} speed speed value
     * @returns {void}
     */
    animationSpeed(speed, reset = false) {
        if (!reset) {
            // Set the animation state
            if (speed != 0) {
                // We use divide by 1 to making reverse range steps
                this._St.Settings.get().slow_down_factor = 1 / speed;
                this._desktopInterfaceSchema.set_boolean('enable-animations', true);
            } else {
                // Diving by 0 is not possible so we set it to 1 (normal speed)
                this._St.Settings.get().slow_down_factor = 1;
                this._desktopInterfaceSchema.set_boolean('enable-animations', false);
            }
        } else {
            // Reset the animation state
            this._desktopInterfaceSchema.set_boolean(
                'enable-animations',
                this._origin['_enableAnimations']
            );

            // Reset the animation speed
            this._St.Settings.get().slow_down_factor = speed;
        }
    }

    /**
     * Shell state at startup
     * @param {MAIN_STARTUP_STATE} state startup state
     * @returns {void}
     */
    startupState(state) {
        if (this._shellVersion >= 40) {
            if (this._Main.layoutManager._startingUp) {
                let controlsState = this._OverviewControls.ControlsState;
                let controls = this._Main.overview._overview.controls;

                switch (state) {
                    case MAIN_STARTUP_STATE.DESKTOP:
                        this._Main.sessionMode.hasOverview = false;

                        // Handle Ubuntu's method
                        if (this._Main.layoutManager.startInOverview) {
                            this._Main.layoutManager.startInOverview = false;
                        }
                        controls._stateAdjustment.value = controlsState.HIDDEN;
                        break;

                    case MAIN_STARTUP_STATE.OVERVIEW:
                    case MAIN_STARTUP_STATE.APP_GRID:
                        this._Main.sessionMode.hasOverview = true;

                        // Handle Ubuntu's method
                        if (this._Main.layoutManager.startInOverview) {
                            this._Main.layoutManager.startInOverview = true;
                        }
                        break;
                }

                if (!this._startupCompleteSignal) {
                    this._startupCompleteSignal = this._Main.layoutManager.connect(
                        'startup-complete', () => {
                            // When startup state is in app grid, we need to wait for the overview
                            // to be ready before we can show the app grid
                            if (state == MAIN_STARTUP_STATE.APP_GRID) {
                                this._Main.overview.dash.showAppsButton.checked = true;
                            }
                            this._Main.sessionMode.hasOverview = this._origin['_hasOverview'];
                            this._Main.layoutManager.disconnect(this._startupCompleteSignal);
                            delete(this._startupCompleteSignal);
                        }
                    )
                }
            }
        }
    }
}