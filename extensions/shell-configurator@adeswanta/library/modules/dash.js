/**
 * Dash module
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

const DASH_ICON_SIZE_ENUM = {
    AUTO: 0,
    TINY: 1,
    SMALLER: 2,
    SMALL: 3,
    MEDIUM_SMALL: 4,
    MEDIUM: 5,
    LARGE: 6,
    LARGER: 7,
    BIGGER: 8,
    HUGE: 9,
};
const DASH_ICON_SIZE = [-1, 16, 24, 32, 48, 56, 64, 72, 80, 96];
const DASH_APPLICATION_BUTTON_POSITION = {
    START: 0,
    END: 1,
};

/**
 * Dash
 *
 * Launches an application and favorites
 *
 * This Module can configure/do:
 * > Show/Hide the dash
 * > Show/Hide the dash separator (GNOME 40 above)
 * > Set the dash icon size
 * > Show/Hide application button
 * > Set the application button position
 */
var DashModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter;
        this._GLib = imports.gi.GLib;

        // UI Libraries
        this._Dash = this._Main.overview.dash;
        this._DashContainer =
            (this._shellVersion >= 40) ?
                this._Dash._dashContainer
            :   this._Dash._container;

        // Private declarations
        this._applicationButtonVisibility = true;
        this._applicationButtonPosition = DASH_APPLICATION_BUTTON_POSITION.END;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'visibility': this._Dash.visible,
            'separatorVisibility':  (this._shellVersion >= 40) ? true : null,
            'applicationButtonVisibility': this._Dash._showAppsIcon.visible,
            'applicationButtonPosition': DASH_APPLICATION_BUTTON_POSITION.END
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.visibility(this._origin['visibility']);

        if (this._shellVersion >= 40) {
            this.separatorVisibility(this._origin['separatorVisibility']);
        }

        this.iconSize(DASH_ICON_SIZE_ENUM.AUTO);
        this.applicationButtonVisibility(this._origin['applicationButtonVisibility']);
        this.applicationButtonPosition(this._origin['applicationButtonPosition']);

        // Remove timeout/main loop sources (if exists)
        if (this._iconSizeChangedTimeout) {
            this._GLib.source_remove(this._iconSizeChangedTimeout);
            delete(this._iconSizeChangedTimeout);
        }
    }

    /**
     * Dash visibility
     * @param {boolean} state visibility size
     * @returns {void}
     */
    visibility(state) {
        if (state) {
            // Show the dash
            this._Dash.show();

            // Set dash size to -1 (Default/fit)
            if (this._shellVersion >= 40) {
                this._Main.overview.dash.height = -1;
                this._Main.overview.dash.setMaxSize(-1, -1);
            } else {
                this._Main.overview.dash.width = -1;
                this._Main.overview.dash._maxHeight = -1;
            }
        } else {
            // Hide the dash
            this._Dash.hide();

            // Set dash size to 0 (not shown) to make view selector/workspace move closer to the
            // bottom/left
            if (this._shellVersion >= 40) {
                this._Main.overview.dash.height = 0;
                this._Main.overview.dash.setMaxSize(0, 0);
            } else {
                this._Main.overview.dash.width = 0;
                this._Main.overview.dash._maxHeight = 0;
            }
        }
    }

    /**
     * Dash separator visibility
     * @param {boolean} state separator visibility state
     */
    separatorVisibility(state) {
        if (this._shellVersion >= 40) {
            // Set the dash separator visibility state
            if (this._Dash._separator) {
                this._Dash._separator.visible = state;
            }

            // Disconnect connected signals, if available.
            if (this._checkSeparatorSignal) {
                this._Dash._box.disconnect(this._checkSeparatorSignal);
                delete(this._checkSeparatorSignal);
            }

            if (!state) {
                // Connect signal to check if separator is visible
                if (!this._checkSeparatorSignal) {
                    this._checkSeparatorSignal = this._Dash._box.connect('actor-added', () => {
                        this.separatorVisibility(state);
                    });
                }
            }
        }
    }

    /**
     * Dash icon size
     * @param {DASH_ICON_SIZE_ENUM} size dash icon size
     * @returns {void}
     */
    iconSize(size) {
        if (this._shellVersion >= 40) {
            if (this._Main.layoutManager._startingUp) {
                if (this._startupCompleteSignal) {
                    this._Main.layoutManager.disconnect(this._startupCompleteSignal);
                    delete(this._startupCompleteSignal);
                }
                this._startupCompleteSignal = this._Main.layoutManager.connect(
                    'startup-complete', () => {
                        this.iconSize(size);
                    }
                );
            }
        }

        let iconChildren = this._Dash._box.get_children().filter(actor => {
            return (
                actor.child &&
                actor.child._delegate &&
                actor.child._delegate.icon &&
                !actor.animatingOut
            );
        });
        iconChildren.push(this._Dash._showAppsIcon);

        // Disconnect connected signals
        if (this._iconSizeChangedSignal) {
            this._Dash.disconnect(this._iconSizeChangedSignal);
            delete(this._iconSizeChangedSignal);
        }
        if (this._DashItemAddedSignal) {
            this._Dash._box.disconnect(this._DashItemAddedSignal);
            delete(this._DashItemAddedSignal);
        }

        if (size != DASH_ICON_SIZE_ENUM.AUTO) {
            // Save the current icon size
            this._origin['visibility'] = this._Dash.iconSize;

            // Set all dash icon size manually
            for (let i = 0; i < iconChildren.length; i++) {
                let icon = iconChildren[i].child._delegate.icon;
                let targetSize = DASH_ICON_SIZE[size];

                // Set the icon size
                icon.setIconSize(targetSize);

                // Run scale animation
                icon.icon.ease({
                    width: targetSize,
                    height: targetSize,
                    duration: this._Dash.DASH_ANIMATION_TIME,
                    mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }

            // Fix the separator too
            if (this._Dash._separator) {
                let targetSize = DASH_ICON_SIZE[size];
                this._Dash._separator.ease({
                    height: targetSize,
                    duration: this._Dash.DASH_ANIMATION_TIME,
                    mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }

            // Prevent dash icon size being changed automatically
            if (!this._iconSizeChangedSignal) {
                this._iconSizeChangedSignal = this._Dash.connect('icon-size-changed', () => {
                    // Delay changes in 20ms because this signal was emitted before the dash icon
                    // size going to changed, so we wait for the dash icon size to be changed
                    this._iconSizeChangedTimeout = this._GLib.timeout_add(
                        this._GLib.PRIORITY_IDLE, 20,
                        () => {
                            this.iconSize(size);
                            delete(this._iconSizeChangedTimeout);
                            return this._GLib.SOURCE_REMOVE;
                        }
                    )
                });
            }

            // Update icon size when a dash item is added
            if (!this._DashItemAddedSignal) {
                this._DashItemAddedSignal = this._Dash._box.connect('actor-added', () => {
                    this.iconSize(size);
                })
            }
        } else {
            // Restore all dash icon size manually
            for (let i = 0; i < iconChildren.length; i++) {
                let icon = iconChildren[i].child._delegate.icon;

                // Taken from generated icon size by internal class
                let targetSize = this._Dash.iconSize;

                // Set the icon size
                icon.setIconSize(targetSize);

                // Run scale animation
                icon.icon.ease({
                    width: targetSize,
                    height: targetSize,
                    duration: this._Dash.DASH_ANIMATION_TIME,
                    mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }

            // Revert back to original size by calling _adjustIconSize method
            this._Dash._adjustIconSize();
        }
    }

    /**
     * Application button visibility
     * @param {boolean} state application button visibility state
     */
    applicationButtonVisibility(state, update) {
        this._applicationButtonVisibility = state;

        let applicationIcon = this._Dash._showAppsIcon;

        if (!update && this._shellVersion <= 3.38) {
            if (state) {
                // Set the position to the last position
                this.applicationButtonPosition(this._applicationButtonPosition);
            } else {
                // Move app icon to the top to hide properly (without bug)
                this._DashContainer.remove_child(applicationIcon);
                this._DashContainer.insert_child_at_index(applicationIcon, 0);
            }
        }

        // Set the application button visibility state
        this._Dash._showAppsIcon.visible = state;
    }

    /**
     * Application button position
     * @param {DASH_APPLICATION_BUTTON_POSITION} position application button position
     */
    applicationButtonPosition(position) {
        this._applicationButtonPosition = position;

        let applicationIcon = this._Dash._showAppsIcon;

        // We move the application button by removing it from the container and adding it again to
        // another position
        switch (position) {
            case DASH_APPLICATION_BUTTON_POSITION.START:
                this._DashContainer.remove_child(applicationIcon);
                this._DashContainer.insert_child_at_index(applicationIcon, 0);
                break;

            case DASH_APPLICATION_BUTTON_POSITION.END:
                if (
                    this._shellVersion >= 40 ||
                    (this._shellVersion <= 3.38 && this._applicationButtonVisibility)
                ) {
                    this._DashContainer.remove_child(applicationIcon);
                    this._DashContainer.add_child(applicationIcon);
                }
                break;
        }

        // Update the button visibility
        this.applicationButtonVisibility(this._applicationButtonVisibility, true);
    }
}