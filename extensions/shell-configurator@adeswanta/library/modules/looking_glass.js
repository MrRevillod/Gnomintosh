/**
 * Looking Glass module
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
 * Looking Glass Vertical position
 * @readonly
 * @enum {number}
 */
const LOOKING_GLASS_VERTICAL_POSITION = {
    TOP: 0,
    BOTTOM: 1,
};

/**
 * Looking Glass
 *
 * Inspecting shell elements and debugging
 *
 * This Module can configure/do:
 * > Set the looking glass position
 * > Set the looking glass size
 */
var LookingGlassModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // Initialize/create looking glass in order not to make looking glass isn't null
        this._Main.createLookingGlass();

        // UI Libraries
        this._Panel = this._Main.panel;
        this._LookingGlass = this._Main.lookingGlass;

        // Private declarations
        this._lastHorizontalPosition = 0;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'horizontal-position': 50,
            'vertical-position': LOOKING_GLASS_VERTICAL_POSITION.TOP,
            'width': this._LookingGlass.width,
            'height': this._LookingGlass.height
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.horizontalPosition(this._origin['horizontal-position']);
        this.verticalPosition(this._origin['vertical-position']);
        this.height(this._origin['height']);
        this.width(this._origin['width']);

        // Resize (fully) to original
        this._Main.lookingGlass._resize();
    }

    /**
     * Looking Glass horizontal position (in percentage)
     * @param {number} size horizontal position in percentage
     * @returns {void}
     */
    horizontalPosition(size) {
        this._LookingGlass.x =
            this._Main.layoutManager.primaryMonitor.x + (
                this._Main.layoutManager.primaryMonitor.width - this._LookingGlass.width
            ) * (size / 100)

        this._lastHorizontalPosition = size;
    }

    /**
     * Looking Glass vertical position (in percentage)
     * @param {LOOKING_GLASS_VERTICAL_POSITION} size vertical position
     * @returns {void}
     */
    verticalPosition(position) {
        let pos = 0

        switch (position) {
            case LOOKING_GLASS_VERTICAL_POSITION.TOP:
                pos =
                    this._Main.layoutManager.primaryMonitor.y + (
                        (this._Panel.visible && this._Main.layoutManager.panelBox.y == 0) ?
                            this._Panel.height : 0
                    )

                this._Main.lookingGlass._hiddenY = pos - this._LookingGlass.height;
                this._Main.lookingGlass._targetY = pos;

                if (this._shellVersion >= 42) {
                    // Restore the looking glass style
                    this._Main.lookingGlass.style = null;
                }

                // Make looking glass keep shown after inspecting shell elements
                this._LookingGlass.y =
                    (!this._Main.lookingGlass._open) ?
                        this._LookingGlass.y = this._Main.lookingGlass._hiddenY
                    :   this._LookingGlass.y = pos;
                break;

            case LOOKING_GLASS_VERTICAL_POSITION.BOTTOM:
                pos =
                    this._Main.layoutManager.primaryMonitor.y + (
                        this._Main.layoutManager.primaryMonitor.height -
                        this._LookingGlass.height - (
                            (
                                // Check if panel position is on the bottom
                                this._Panel.visible && this._Main.layoutManager.panelBox.y == (
                                    this._Main.layoutManager.primaryMonitor.height -
                                    this._Panel.height
                                )
                            ) ? this._Panel.height : 0
                        )
                    );
                    this._Main.lookingGlass._hiddenY =
                    this._Main.layoutManager.primaryMonitor.height - (
                        (
                            // Check if panel position is on the bottom
                            this._Panel.visible && this._Main.layoutManager.panelBox.y == (
                                this._Main.layoutManager.primaryMonitor.height -
                                this._Panel.height
                            )
                        ) ? this._Panel.height : 0
                    );

                this._Main.lookingGlass._targetY = pos;

                if (this._shellVersion >= 42) {
                    // Fix the looking glass style
                    this._Main.lookingGlass.style = "border-radius: 16px 16px 0 0;";
                }

                // Make looking glass keep shown after inspecting shell elements
                this._LookingGlass.y =
                    (!this._Main.lookingGlass._open) ?
                        this._LookingGlass.y = this._Main.lookingGlass._hiddenY
                    :   this._LookingGlass.y = pos;
                break;
        }
    }

    /**
     * Looking Glass width size
     * @param {number} size width size
     * @returns {void}
     */
    width(size) {
        this._LookingGlass.width = size;

        // Repositioning the looking glass
        this.horizontalPosition(this._lastHorizontalPosition);
    }

    /**
     * Looking Glass height size
     * @param {number} size width size
     * @returns {void}
     */
    height(size) {
        this._LookingGlass.height = size;

        // Repositioning
        this.verticalPosition(this._getPosition())
    }

    /**
     * Get Looking Glass position
     * @returns {LOOKING_GLASS_VERTICAL_POSITION}
     */
    _getPosition() {
        // Check panel y position
        let verticalPosition = this._Main.lookingGlass._targetY;
        let targetPosition = this._Main.layoutManager.primaryMonitor.y + this._Panel.height;

        // return 0 for TOP and 1 for BOTTOM
        return (verticalPosition <= targetPosition) ?
            LOOKING_GLASS_VERTICAL_POSITION.TOP
        :   LOOKING_GLASS_VERTICAL_POSITION.BOTTOM;
    }
}