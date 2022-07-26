/**
 * Screenshot
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

const SCREENSHOT_DIALOG_VERTICAL_POSITION = {
    TOP: 0,
    BOTTOM: 1
}

/**
 * Screenshot
 *
 * GNOME's Screenshot Tool Built-In
 *
 * This Module can configure/do:
 * > Set the screenshot dialog vertical position
 */
var ScreenshotModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter || null;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'dialogVerticalPosition': SCREENSHOT_DIALOG_VERTICAL_POSITION.BOTTOM
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.dialogVerticalPosition(this._origin['dialogVerticalPosition']);
    }

    /**
     * Screenshot UI Vertical Position
     * @param {SCREENSHOT_DIALOG_VERTICAL_POSITION} position vertical position
     * @returns {void}
     */
    dialogVerticalPosition(position) {
        switch (position) {
            case SCREENSHOT_DIALOG_VERTICAL_POSITION.TOP:
                this._Main.screenshotUI._panel.y_align = this._Clutter.ActorAlign.START;
                this._Main.screenshotUI._panel.style = "margin: 4em;";

                // Fix the window selector style
                this._Main.screenshotUI._windowSelectors[0]._container.style =
                    "margin-bottom: 100px; margin-top: 200px;";
                break;

            case SCREENSHOT_DIALOG_VERTICAL_POSITION.BOTTOM:
                this._Main.screenshotUI._panel.y_align = this._Clutter.ActorAlign.END;
                this._Main.screenshotUI._panel.style = null;

                // Revert back the window selector style
                this._Main.screenshotUI._windowSelectors[0]._container.style = null;
                break;
        }
    }
}