/**
 * OSD
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

const OSD_HORIZONTAL_POSITION = {
    START: 0,
    CENTER: 1,
    END: 2
}

const OSD_VERTICAL_POSITION = {
    TOP: 0,
    CENTER: 1,
    BOTTOM: 2
}

/**
 * OSD
 *
 * On Screen Dialog that appears on the screen when system settings changes (such as volume,
 * brightness, etc.)
 *
 * This Module can configure/do:
 * > Set the OSD position
 */
var OSDModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter || null;

        // UI libraries
        this._OSDWindowManager = this._Main.osdWindowManager || null;

        // Private declarations
        this._lastPosition = [
            this._OSDWindowManager._osdWindows[0].x_align,
            this._OSDWindowManager._osdWindows[0].y_align
        ];
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'horizontalPosition': this._Clutter.ActorAlign.CENTER,
            'verticalPosition': this._Clutter.ActorAlign.END
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        // We use internal method instead.
        // So we don't need call two of them (horizontalPosition, verticalPosition).
        this._setPosition(
            this._origin['horizontalPosition'], this._origin['verticalPosition'],
            false
        );
    }

    /**
     * Set the osd position every window manager
     * @param {OSD_HORIZONTAL_POSITION} horizontal horizontal position
     * @param {OSD_VERTICAL_POSITION} vertical vertical position
     * @param {boolean} fix fix the osd window style
     * @returns {void}
     */
    _setPosition(horizontal, vertical, fix = false) {
        this._OSDWindowManager._osdWindows.forEach((osdWindow, index) => {
            let monitor = this._Main.layoutManager.monitors[index];

            // Set the position each display
            osdWindow.set_x_align(horizontal);
            if (this._shellVersion >= 42) osdWindow.set_y_align(vertical);
            // We align (vertical) the box manually for GNOME 41 below

            if (this._shellVersion >= 42) {
                // Fix the style
                osdWindow._hbox.style = fix ? "margin: 4em" : null;
            } else {
                let padding = [Math.round(monitor.width / 8), Math.round(monitor.height / 4)];

                // Change the x translation for horizontal position
                switch (horizontal) {
                    case this._Clutter.ActorAlign.START:
                        osdWindow._box.translation_x = padding[0];
                        break;

                    case this._Clutter.ActorAlign.CENTER:
                        osdWindow._box.translation_x = 0;
                        break;

                    case this._Clutter.ActorAlign.END:
                        osdWindow._box.translation_x = padding[0] * -1;
                        break;
                }

                // Change the y translation for vertical position
                switch (vertical) {
                    case this._Clutter.ActorAlign.START:
                        osdWindow._box.translation_y = padding[1] * -1;
                        break;

                    case this._Clutter.ActorAlign.CENTER:
                        osdWindow._box.translation_y = 0;
                        break;

                    case this._Clutter.ActorAlign.END:
                        osdWindow._box.translation_y = padding[1];
                        break;
                }

            }
        })

        // Set the last position
        this._lastPosition = [horizontal, vertical];
    }

    /**
     * OSD horizontal position
     * @param {OSD_HORIZONTAL_POSITION} position horizontal position
     * @returns {void}
     */
    horizontalPosition(position) {
        switch (position) {
            case OSD_HORIZONTAL_POSITION.START:
                this._setPosition(this._Clutter.ActorAlign.START, this._lastPosition[1], true);
                break;

            case OSD_HORIZONTAL_POSITION.CENTER:
                this._setPosition(this._Clutter.ActorAlign.CENTER, this._lastPosition[1], true);
                break;

            case OSD_HORIZONTAL_POSITION.END:
                this._setPosition(this._Clutter.ActorAlign.END, this._lastPosition[1], true);
                break;
        }
    }

    /**
     * OSD vertical position
     * @param {OSD_VERTICAL_POSITION} position vertical position
     * @returns {void}
     */
    verticalPosition(position) {
        switch (position) {
            case OSD_VERTICAL_POSITION.TOP:
                this._setPosition(this._lastPosition[0], this._Clutter.ActorAlign.START, true);
                break;

            case OSD_VERTICAL_POSITION.CENTER:
                this._setPosition(this._lastPosition[0], this._Clutter.ActorAlign.CENTER, true);
                break;

            case OSD_VERTICAL_POSITION.BOTTOM:
                this._setPosition(this._lastPosition[0], this._Clutter.ActorAlign.END, true);
                break;
        }
    }
}