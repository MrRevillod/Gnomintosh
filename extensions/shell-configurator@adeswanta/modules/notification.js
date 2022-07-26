/**
 * Notification module
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

const NOTIFICATION_BANNER_HORIZONTAL_POSITION = {
    START: 0,
    CENTER: 1,
    END: 2
}

const NOTIFICATION_BANNER_VERTICAL_POSITION = {
    TOP: 0,
    BOTTOM: 1
}

/**
 * Notification
 *
 * A popup that displays a message to the user.
 *
 * This Module can configure/do:
 * > Set the notification position
 * > Set the notification hide timeout
 */
var NotificationModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter;

        // UI libraries
        this._messageTray = this._Main.messageTray;
        this._messageTrayModule = imports.ui.messageTray;

        // Private declarations
        this._margin = 0;
        this._verticalPosition = NOTIFICATION_BANNER_VERTICAL_POSITION.TOP;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'horizontalBannerPosition': this._messageTray.bannerAlignment,
            'verticalBannerPosition': this._messageTray._bannerBin.get_y_align(),
            'timeout': this._messageTrayModule.NOTIFICATION_TIMEOUT,
            '_hideNotification': this._messageTrayModule.MessageTray.prototype._hideNotification
        };
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.horizontalBannerPosition(this._origin['horizontalBannerPosition']);
        this.verticalBannerPosition(this._origin['verticalBannerPosition']);
        this.timeout(0);
    }

    /**
     * Notification banner in horizontal position
     * @param {NOTIFICATION_BANNER_HORIZONTAL_POSITION} position horizontal position
     */
    horizontalBannerPosition(position) {
        switch (position) {
            case NOTIFICATION_BANNER_HORIZONTAL_POSITION.START:
                this._messageTray.bannerAlignment = this._Clutter.ActorAlign.START;
                break;

            case NOTIFICATION_BANNER_HORIZONTAL_POSITION.CENTER:
                this._messageTray.bannerAlignment = this._Clutter.ActorAlign.CENTER;
                break;

            case NOTIFICATION_BANNER_HORIZONTAL_POSITION.END:
                this._messageTray.bannerAlignment = this._Clutter.ActorAlign.END;
                break;
        }
    }

    /**
     * Patch bugs and fixes for the ui.messageTray.messageTray._hideNotification
     *
     * [Bottom Panel Information]
     * This patch is going to fix the animation when the banner position is in bottom area.
     * The code was forked from ui.messageTray.MessageTray._hideNotification method with
     * Clutter animation mode set to EASE. because the EASE_OUT_BACK (original code) causes
     * glitch when hiding the notification
     *
     * @param {boolean} state patch state
     * @param {NOTIFICATION_BANNER_VERTICAL_POSITION} verticalPos banner vertical position
     */
    _patchHideNotification(state) {
        let messageTray = this._Main.messageTray;
        if (state) {
            // We use scoped constant value to link those variables
            const State = this._messageTrayModule.State;
            const ANIMATION_TIME = this._messageTrayModule.ANIMATION_TIME;
            const SHELL_VERSION = this._shellVersion;
            const Clutter = this._Clutter;
            const BannerMargin = this._margin;
            const BannerVerticalPosition = this._verticalPosition;

            messageTray._hideNotification = function (animate) {
                let animationMode =
                    (BannerVerticalPosition == NOTIFICATION_BANNER_VERTICAL_POSITION.BOTTOM) ?
                        Clutter.AnimationMode.EASE
                    :   Clutter.AnimationMode.EASE_OUT_BACK;
                let hideProp = {
                    opacity: 0,
                    duration: ANIMATION_TIME,
                    mode: animationMode,
                    onComplete: () => {
                        this._notificationState = State.HIDDEN;
                        this._hideNotificationCompleted();
                        this._updateState();
                    },
                };
                if (BannerVerticalPosition == NOTIFICATION_BANNER_VERTICAL_POSITION.TOP) {
                    hideProp.y = -(this._bannerBin.height + (BannerMargin * 2));
                }

                this._notificationFocusGrabber.ungrabFocus();

                if (SHELL_VERSION >= 42) {
                    this._banner.disconnectObject(this);
                } else {
                    if (this._bannerClickedId) {
                        this._banner.disconnect(this._bannerClickedId);
                        this._bannerClickedId = 0;
                    }
                    if (this._bannerUnfocusedId) {
                        this._banner.disconnect(this._bannerUnfocusedId);
                        this._bannerUnfocusedId = 0;
                    }
                }

                this._resetNotificationLeftTimeout();
                this._bannerBin.remove_all_transitions();

                if (animate) {
                    this._notificationState = State.HIDING;
                    this._bannerBin.ease({
                        opacity: 0,
                        duration: ANIMATION_TIME,
                        mode: animationMode,
                    });
                    this._bannerBin.ease(hideProp);
                } else {
                    this._bannerBin.y = this._bannerBin.y;
                    this._bannerBin.opacity = 0;
                    this._notificationState = State.HIDDEN;
                    this._hideNotificationCompleted();
                }
            }
        } else {
            messageTray._hideNotification = this._origin['_hideNotification'];
        }
    }

    /**
     * Notification banner in vertical position
     * @param {NOTIFICATION_BANNER_VERTICAL_POSITION} position vertical position
     */
    verticalBannerPosition(position) {
        this._verticalPosition = position;
        switch (position) {
            case NOTIFICATION_BANNER_VERTICAL_POSITION.TOP:
                this._messageTray._bannerBin.set_y_align(this._Clutter.ActorAlign.START);
                break;

            case NOTIFICATION_BANNER_VERTICAL_POSITION.BOTTOM:
                this._messageTray._bannerBin.set_y_align(this._Clutter.ActorAlign.END);
                break;
        }

        // See _patchHideNotification method for more details
        this._patchHideNotification(position == NOTIFICATION_BANNER_VERTICAL_POSITION.BOTTOM);
    }

    /**
     * Notification banner padding size
     * @param {number} size padding size
     * @returns {void}
     */
    margin(size) {
        this._margin = size;
        if (size != 0) {
            this._messageTray._bannerBin.style = `margin: ${size}px`;
            this._patchHideNotification(true);
        } else {
            this._messageTray._bannerBin.style = null;
            this._patchHideNotification(false);
        }
    }

    /**
     * Notification banner hide timeout
     * Default Value: 0 (sets the default timeout)
     * @param {number} time timeout duration in second
     * @returns {void}
     */
    timeout(time) {
        // Convert time from second to milliseconds
        let msTime = time * 1000;

        // Set the timeout duration
        this._messageTrayModule.NOTIFICATION_TIMEOUT =
            (msTime >= 1000) ? msTime : this._origin['timeout'];
    }
}