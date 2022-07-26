/**
 * App Grid module
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
 * App Grid
 *
 * Collection of Applications
 *
 * This Module can configure/do:
 * > Set the app grid row/column
 */
var AppGridModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._GObject = imports.gi.GObject;

        // Private declarations
        this._isDoubleSuper = true;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'rows':
                (this._shellVersion >= 3.38) ?
                    (this._shellVersion >= 40) ?
                        this._Main.overview._overview._controls._appDisplay._grid.layout_manager
                            .rows_per_page
                    :   this._Main.overview.viewSelector.appDisplay._grid.layout_manager
                            .rows_per_page
                :   this._Main.overview.viewSelector.appDisplay._views[0].view._grid._minRows
                ||  this._Main.overview.viewSelector.appDisplay._views[1].view._grid._minRows,
            'columns':
                (this._shellVersion >= 3.38) ?
                    (this._shellVersion >= 40) ?
                        this._Main.overview._overview._controls._appDisplay._grid.layout_manager
                            .columns_per_page
                    :   this._Main.overview.viewSelector.appDisplay._grid.layout_manager
                            .columns_per_page
                :   this._Main.overview.viewSelector.appDisplay._views[0].view._grid._colLimit
                ||  this._Main.overview.viewSelector.appDisplay._views[1].view._grid._colLimit,
            'gridModes':
                (this._shellVersion >= 40) ?
                    this._Main.overview._overview._controls._appDisplay._grid._gridModes
                :   null,
            'doubleSuper':
                this._GObject.signal_handler_find(global.display, { signalId: 'overlay-key' }),
        }

        // Fixed from https://gitlab.com/adeswantaTechs/shell-configurator/-/issues/3
        // Make gridModes empty in order to make grid size persistent
        if (this._shellVersion >= 40)
            this._Main.overview._overview._controls._appDisplay._grid._gridModes = [];
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.rows(this._origin['rows']);
        this.columns(this._origin['columns']);

        if (this._shellVersion >= 40) {
            // Restore gridModes
            this._Main.overview._overview._controls._appDisplay._grid
                ._gridModes = this._origin['gridModes'];

            this.doubleSuper(true);
        }
    }

    /**
     * AppGrid row page item
     * @param {number} size number of row page item
     * @returns {void}
     */
    rows(size) {
        if (this._shellVersion >= 3.38) {
            if (this._shellVersion >= 40) {
                // Set row size
                this._Main.overview._overview._controls._appDisplay._grid.layout_manager
                    .rows_per_page = size;

                // Redisplay app grid
                this._Main.overview._overview._controls._appDisplay._redisplay();
            } else {
                // Set row size
                this._Main.overview.viewSelector.appDisplay._grid.layout_manager
                    .rows_per_page = size;

                // Redisplay app grid
                this._Main.overview.viewSelector.appDisplay._redisplay();
            }
        } else {
            // Set row size for frequent page
            this._Main.overview.viewSelector.appDisplay._views[0].view._grid._minRows = size;

            // Redisplay app grid
            this._Main.overview.viewSelector.appDisplay._views[0].view._redisplay();

            // Set row size for all (apps) page
            this._Main.overview.viewSelector.appDisplay._views[1].view._grid._minRows = size;

            // Redisplay app grid
            this._Main.overview.viewSelector.appDisplay._views[1].view._redisplay();
        }
    }

    /**
     * AppGrid column page item
     * @param {number} size number of column page item
     * @returns {void}
     */
    columns(size) {
        if (this._shellVersion >= 3.38) {
            if (this._shellVersion >= 40) {
                // Set row size
                this._Main.overview._overview._controls._appDisplay._grid.layout_manager
                    .columns_per_page = size;

                // Redisplay app grid
                this._Main.overview._overview._controls._appDisplay._redisplay();
            } else {
                // Set column size
                this._Main.overview.viewSelector.appDisplay._grid.layout_manager

                    .columns_per_page = size;
                // Redisplay app grid
                this._Main.overview.viewSelector.appDisplay._redisplay();
            }
        } else {
            // Set column size for frequent page
            this._Main.overview.viewSelector.appDisplay._views[0].view._grid._colLimit = size;

            // Redisplay app grid
            this._Main.overview.viewSelector.appDisplay._views[0].view._redisplay();

            // Set column size for all (apps) page
            this._Main.overview.viewSelector.appDisplay._views[1].view._grid._colLimit = size;

            // Redisplay app grid
            this._Main.overview.viewSelector.appDisplay._views[1].view._redisplay();
        }
    }

    /**
     * Set double press super key to navigate to App Grid
     * @param {boolean} state double super to app grid behavior state
     */
    doubleSuper(state) {
        this._isDoubleSuper = state; // Determine the state

        if (state) {
            // Disconnect connected signals
            if (this._overlayKeySignal) {
                global.display.disconnect(this._overlayKeySignal);
                delete(this._overlayKeySignal);
            }

            if (!this._isDoubleSuper) {
                // Unblock the original keybinding signal
                this._GObject.signal_handler_unblock(
                    global.display, this._origin['doubleSuper']
                );
            }
        } else {
            if (this._isDoubleSuper) {
                // Block the original keybinding signal
                this._GObject.signal_handler_block(
                    global.display, this._origin['doubleSuper']
                );
            }

            // Connect the overlay keybinding signal
            if (!this._overlayKeySignal) {
                this._overlayKeySignal = global.display.connect('overlay-key', () => {
                    if (!this._Main.overview.animationInProgress) {
                        this._Main.overview.toggle();
                    }
                });
            }
        }
    }
}