/**
 * Overview module
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    schema:Schema,
} = Self.imports.library;
const template = Self.imports.library.modules._template;

/**
 * Overview
 *
 * Your activities overview
 *
 * This Module can configure/do:
 * > Set the overview background to static desktop background
 */
var OverviewModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // UI libraries
        this._Background = imports.ui.background || null;

        // Private declarations
        this._backgroundManagers = [];
        this._callbacks = {};
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'staticBackground': false
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.staticDesktopBackground(this._origin['staticBackground']);

        // Remove empty variables
        delete(this._backgroundManagers);
    }

    /**
     * Set overview background to static desktop background
     * @param {boolean} state static desktop background state
     * @returns {void}
     */
    staticDesktopBackground(state) {
        if (this._shellVersion >= 40) {
            let addBackgrounds = () => {
                // Add backgrounds on every monitor
                this._Main.layoutManager.monitors.forEach( monitor => {
                    // Create new background manager and push it
                    let backgroundManager = new this._Background.BackgroundManager({
                        monitorIndex: monitor.index,
                        container: this._Main.layoutManager.overviewGroup,
                        vignette: true
                    });
                    this._backgroundManagers.push(backgroundManager);

                    let backgroundContent = backgroundManager.backgroundActor.content;
                    let adjustment = this._Main.overview._overview._controls._stateAdjustment;

                    // We add private property for fade signal
                    backgroundManager._fadeSignal = adjustment.connect('notify::value', (v) => {
                        let vignette_sharpness = this._Util.lerp(0, 0.6, Math.min(v.value, 1));
                        let brightness = this._Util.lerp(1, 0.75, Math.min(v.value, 1));
                        backgroundContent.vignette_sharpness = vignette_sharpness;
                        backgroundContent.brightness = brightness;
                    });

                    // Callbacks
                    let reloadBackgrounds = () => {
                        removeBackgrounds();
                        addBackgrounds();
                    }
                    backgroundManager._monitorChangesSignal =
                        this._Main.layoutManager.connect('monitors-changed', () => {
                            reloadBackgrounds();
                        })
                    backgroundManager._backgroundManagerChangedSignal =
                        backgroundManager.connect('changed', () => {
                            reloadBackgrounds();
                        })
                });
            }
            let removeBackgrounds = () => {
                // Remove all background managers for every monitor
                for (let manager of this._backgroundManagers) {
                    this._Main.overview._overview._controls._stateAdjustment
                        .disconnect(manager._fadeSignal);
                    delete(manager._fadeSignal);

                    this._Main.layoutManager.disconnect(manager._monitorChangesSignal);
                    delete(manager._monitorChangesSignal);

                    manager.disconnect(manager._backgroundManagerChangedSignal);
                    delete(manager._backgroundManagerChangedSignal);

                    manager.destroy();
                }

                // Clear array
                this._backgroundManagers = [];
            }

            // Set the state
            if (state)
                addBackgrounds();
            else
                removeBackgrounds();
        }
    }
}