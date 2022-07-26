/**
 * Panel module
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
 * Panel position
 * @readonly
 * @enum {number}
 */
const PANEL_POSITION = {
    TOP: 0,
    BOTTOM: 1,
};

/**
 * Panel
 *
 * Your system control on the top of display
 *
 * This Module can configure/do:
 * > Show/Hide the panel
 * > Automatically hides/show the panel and show when user mouse over the panel
 * > Show the panel on overview when panel hides
 * > Show/Hide the panel elements
 * > Set the panel position
 * > Set the panel height
 */
var PanelModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter;
        this._GLib = imports.gi.GLib;

        // UI Libraries
        this._Panel = this._Main.panel;
        this._SearchEntry = this._Main.overview.searchEntry;

        // Schemas
        this._desktopInterfaceSchema = Schema.newSchema('org.gnome.desktop.interface');

        // Private declarations
        this._autoHide = false;
        this._panelDirection = (this._getPosition() == PANEL_POSITION.TOP) ? -1 : 1;
        this._animationDuration = 240;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'visibility': this._Panel.visible,
            'autoHide': this._autoHide,
            'height': this._Panel.height,
            'panelPosition': this._getPosition(),
            'elements': {
                'activities': this._Panel.statusArea.activities.visible,
                'appMenu': this._Panel.statusArea.appMenu.visible,
                'dateMenu': this._Panel.statusArea.dateMenu.visible,
                'keyboard': this._Panel.statusArea.keyboard.visible,
                'a11y': this._Panel.statusArea.a11y.visible,
                'aggregateMenu': this._Panel.statusArea.aggregateMenu.visible,
            },
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.visibility(this._origin['visibility']);
        this.autoHide(this._origin['autoHide']);
        this.elementVisibilityQueue([
            ['activities', this._origin['elements']['activities']],
            ['appMenu', this._origin['elements']['appMenu']],
            ['dateMenu', this._origin['elements']['dateMenu']],
            ['keyboard', this._origin['elements']['keyboard']],
            ['a11y', this._origin['elements']['a11y']],
            ['aggregateMenu', this._origin['elements']['aggregateMenu']],
        ]);
        this.height(this._origin['height']);
        this.position(this._origin['panelPosition']);
    }

    /**
     * Animate and show the panel
     * @returns {void}
     */
    _animateShow(onComplete = () => {}) {
        // Animation Properties
        if (this._autoHide) this._Panel.show();
        let animationProp = {
            translation_y: 0,
            transition: 'easeOutQuad',
            mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
            time: this._animationDuration / 1000,
            duration: this._animationDuration,
            onComplete: onComplete
        }

        // Run Animation
        this._Main.layoutManager.panelBox.ease(animationProp);
    }

    /**
     * Animate and hide the panel
     * @returns {void}
     */
    _animateHide(onComplete = () => {}) {
        // Animation Properties
        let animationProp = {
            translation_y: this._Panel.height * this._panelDirection,
            transition: 'easeOutQuad',
            mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
            time: this._animationDuration / 1000,
            duration: this._animationDuration,
            onComplete: onComplete
        }

        // Run Animation
        this._Main.layoutManager.panelBox.ease(animationProp);
    }

    /**
     * Set the panel overlap state, set false when window want to overlap with the panel
     * @param {boolean} state panel overlap state
     * @returns {void}
     */
    _setOverlap(state) {
        // Get the tracked index of the panel
        let trackedIndex = this._Main.layoutManager._findActor(this._Main.layoutManager.panelBox);

        // Affect struts makes the panel not going to overlaps windows
        this._Main.layoutManager._trackedActors[trackedIndex].affectsStruts = state;
    }

    /**
     * Fix the UI style
     * @return {void}
     */
    _fixUI() {
        // Set the search entry parent style when the panel isn't shown or isn't on the top to make
        // the panel not closer to the top of the screen
        if (this._shellVersion >= 40) {
            if (this._getPosition() == PANEL_POSITION.BOTTOM || !this._isVisible()) {
                this._SearchEntry.get_parent().style = `margin-top: 36px`;
            } else if (this._showOnOverview) {
                this._SearchEntry.get_parent().style = `margin-top: ${this._Panel.height}px`;
            } else {
                this._SearchEntry.get_parent().style = null;
            }
        } else {
            if (
                this._getPosition() == PANEL_POSITION.BOTTOM ||
                (!this._showOnOverview && (!this._isVisible() || this._autoHide))
            ) {
                this._SearchEntry.get_parent().style = `margin-top: 36px`;
                this._Main.overview._overview.get_children()[0].hide();
            } else {
                this._SearchEntry.get_parent().style = null;
                this._Main.overview._overview.get_children()[0].show();
            }
        }

        // Set overview controls style to make panel didn't overlap the overview/window
        // previews
        if (
            this._getPosition() == PANEL_POSITION.BOTTOM &&
            (this._isVisible() || this._showOnOverview)
        ) {
            this._Main.overview._overview._controls.style =
                `margin-bottom: ${this._Main.panel.height}px;`;
        } else {
            this._Main.overview._overview._controls.style = null;
        }
    }

    /**
     * Panel visibility
     * @param {boolean} state visibility state
     * @param {boolean} showOnOverview show panel on overview
     * @returns {void}
     */
    visibility(state, showOnOverview) {
        let show = () => {
            // Show the panel
            this._Panel.show();

            // Fix the UI style
            this._fixUI();

            this._animateShow(() => {
                // Restores trackedActor properties for panelBox
                // But don't do this when panel is in auto hide mode
                if (!this._autoHide) { this._setOverlap(true); }

                // Hide and show can fix windows not going under panel
                this._Main.layoutManager.panelBox.hide();
                this._Main.layoutManager.panelBox.show();

                // Update the show on overview state
                this.showOnOverview(false)
            });
        }
        let hide = () => {
            // When auto hide:
            // make panel overlap by changing trackedActor properties for panelBox
            this._setOverlap(false);

            this._animateHide(() => {
                // Hide the panel
                this._Panel.hide();

                // Update the show on overview state
                this.showOnOverview(showOnOverview);

                // Fix the UI style
                this._fixUI();
            });
        }

        // Sets the panel visibility
        if (state) {
            show();
        } else {
            hide();
        }
    }

    /**
     * Determine if the mouse is entering the panel
     * @returns {boolean}
     */
    _checkPanelEnter() {
        if (this._getPosition() == PANEL_POSITION.TOP) {
            return global.get_pointer()[1] >= this._targetLeave;
        } else {
            return global.get_pointer()[1] <= this._targetLeave;
        }
    }

    /**
     * Handling the popup menus for unexpected auto hiding behavior when mouse leaving
     * @returns {void}
     */
    _handleBlockedMenu() {
        // Get the active menus
        this._blockedMenu = this._Main.panel.menuManager.activeMenu;

        if (this._blockedMenu == null) {
            if (this._checkPanelEnter()) this._animateHide();
        } else {
            // If there is a blocked menu, we wait panel hides until its menu is closed and
            this._blockedMenuSignal = this._blockedMenu.connect('open-state-changed', (menu, open) => {
                if (!open && this._blockedMenu !== null && this._autoHide) {
                    delete(this._blockedMenu);
                    this._handleBlockedMenu();

                    this._blockedMenu.disconnect(this._blockedMenuSignal);
                    delete(this._blockedMenuSignal);
                }
            });
        }
    }

    /**
     * Auto hides the panel
     * @param {boolean} state auto hide state
     * @param {boolean} [update=false] make an update state
     * @returns {void}
     */
    autoHide(state, update = false) {
        this._autoHide = state;
        this._hoverCallbacks = [];

        let primaryMonitor = this._Main.layoutManager.primaryMonitor;

        // Set the targetLeave
        this._targetLeave =
            (this._getPosition() == PANEL_POSITION.TOP) ?
                this._Panel.height
            :   primaryMonitor.height - this._Panel.height;

        let add = () => {
            let yPos = (this._getPosition() == PANEL_POSITION.TOP) ? 0 : primaryMonitor.height;

            // Add the barrier
            this._barrier = new imports.gi.Meta.Barrier({
                display: global.display,
                x1: primaryMonitor.x,
                x2: primaryMonitor.x + primaryMonitor.width,
                y1: yPos,
                y2: yPos,
                directions:
                    (this._getPosition() == PANEL_POSITION.TOP) ?
                        imports.gi.Meta.BarrierDirection.POSITIVE_Y
                    :   imports.gi.Meta.BarrierDirection.NEGATIVE_Y
            });

            // Add the pressure barrier
            this._pressureBarrier = new imports.ui.layout.PressureBarrier(
                50,
                1000,
                imports.gi.Shell.ActionMode.NORMAL | imports.gi.Shell.ActionMode.OVERVIEW
            );
            this._pressureBarrier.addBarrier(this._barrier);

            // Add hover callbacks
            this._hoverCallbacks.push(
                this._pressureBarrier.connect('trigger', () => {
                    this._Panel.show();
                    if (this._autoHide) this._animateShow();
                })
            );
            this._hoverCallbacks.push(
                this._Main.layoutManager.panelBox.connect('leave-event', () => {
                    if (this._checkPanelEnter() && this._autoHide &&
                        (this._Main.panel.menuManager.activeMenu == null) ) {
                            if (this._showOnOverview) {
                                if (!this._Main.overview.visible) this._animateHide();
                            } else {
                                this._animateHide(() => { this._Panel.hide() });
                            }
                    }

                    // Prevent panel hiding when popup menu is shown by handling blocked popup menu
                    if (this._Main.panel.menuManager.activeMenu != null && this._autoHide) {
                        this._handleBlockedMenu();
                    }
                })
            );
        }
        let remove = () => {
            // Disconnect hover callbacks
            if (this._hoverCallbacks[1]) {
                this._Main.layoutManager.panelBox.disconnect(this._hoverCallbacks[1]);
            }

            // Remove the pressure barrier and disconnect its callbacks
            if (this._pressureBarrier && this._hoverCallbacks[0] && this._barrier) {
                this._pressureBarrier.disconnect(this._hoverCallbacks[0]);
                this._pressureBarrier.removeBarrier(this._barrier);
                delete(this._pressureBarrier);
            }

            // Remove the barrier
            if (this._barrier) {
                this._barrier.destroy();
                delete(this._barrier);
            }
        }

        if (state) {
            // Set track_hover and reactive state for panelBox
            this._Main.layoutManager.panelBox.set({ track_hover: true, reactive: true });

            // Make panel overlap
            this._setOverlap(false);

            // Add the Barrier
            add();

            this._animateHide(() => {
                // Hide the panel
                this._Panel.hide();

                // Fix the UI style
                this._fixUI();

                // Hide and show can fix windows not going under panel
                this._Main.layoutManager.panelBox.hide();
                this._Main.layoutManager.panelBox.show();

                // Reset show on overview state
                if (this._showOnOverview) {
                    this.showOnOverview(false, false);
                    this.showOnOverview(true, false);
                }
            });
        } else {
            // Remove the barrier
            remove();

            // Show the panel
            this._Panel.show();

            // Fix the UI style
            this._fixUI();

            this._animateShow(() => {
                // Revert panel overlap state
                this._setOverlap(true);

                // Hide and show can fix windows not going under panel
                this._Main.layoutManager.panelBox.hide();
                this._Main.layoutManager.panelBox.show();

                // Revert track_hover and reactive state for panelBox
                this._Main.layoutManager.panelBox.set({ track_hover: false, reactive: false });

                // Update the show on overview state
                if (this._showOnOverview) this.showOnOverview(false, false);
            });
        }

        // Fix the UI style
        if (update) this._fixUI();

        // Reposition panel translation
        if ((this._autoHide || this._showOnOverview) && update)
            this._Main.layoutManager.panelBox.translation_y =
                this._Panel.height * this._panelDirection;
    }

    showOnOverview(state, update = true) {
        // Update the show on overview state
        if (update) this._showOnOverview = state;

        // Fix the UI style
        this._fixUI();

        if (state) {
            if ((this._autoHide || !this._isVisible())) {
                // Connect signals
                if (!this.onOverviewShowSignal) {
                    this.onOverviewShowSignal = this._Main.overview.connect('showing', () => {
                        this._Panel.show();
                        this._animateShow();
                    })
                }
                if (!this.onOverviewHideSignal) {
                    this.onOverviewHideSignal = this._Main.overview.connect('hiding', () => {
                        this._animateHide(() => {
                            this._Panel.hide();
                        });
                    })
                }
            }
        } else {
            // Disconnect signals
            if (this.onOverviewShowSignal) {
                this._Main.overview.disconnect(this.onOverviewShowSignal);
                delete(this.onOverviewShowSignal)
            }
            if (this.onOverviewHideSignal) {
                this._Main.overview.disconnect(this.onOverviewHideSignal);
                delete(this.onOverviewHideSignal)
            }
        }
    }

    /**
     * Panel element visibility (individual)
     * @param {*} name element name
     * @param {boolean} state element visibility state
     */
    elementVisibility(name, state) {
        switch (name) {
            case 'a11y':
            case 'keyboard':
                this._Panel.statusArea[name].container.visible = state;
                break;

            default:
                this._Panel.statusArea[name].visible = state;
                break;
        }
    }

    /**
     * Panel elements visibility (in order)
     * @param {Array} elements panel element on statusArea
     */
    elementVisibilityQueue(elements) {
        for (let element of elements) {
            this.elementVisibility(element[0], element[1]);
        }
    }

    /**
     * Panel height size
     * @param {number} size height size
     * @param {boolean} unlimited force size unlimited
     * @returns {void}
     */
    height(size, unlimited) {
        // It use for temporary
        if (unlimited) {
            this._Panel.height = size;
            return;
        }

        // Size must be limited by this range (16 - 128)
        if (size >= 16 && size <= 128) {
            // Make panel height changes if panel is visible
            if (this._isVisible() || this._showOnOverview) {
                // Set panel height
                this._Panel.height = size;
            }
        }

        // Repositioning the panel
        this.position(this._getPosition());

        // Fix the UI style
        this._fixUI();
    }

    /**
     * Panel position
     * @param {PANEL_POSITION} position position of the panel
     * @returns {void}
     */
    position(position) {
        switch (position) {
            case PANEL_POSITION.TOP:
                // Set position to top
                this._Main.layoutManager.panelBox.set_position(0, 0);

                // Check if panel is visible.
                if (this._isVisible()) {
                    // Remove 'no-top-panel' style
                    this._Main.layoutManager.uiGroup.remove_style_class_name(
                        this._Misc.getSCStyle('no-top-panel', 'all')
                    );
                }
                // Reset the overview control style
                this._Main.overview._overview._controls.style = null;

                // Remove 'bottom-panel' style
                this._Main.layoutManager.uiGroup.remove_style_class_name('bottom-panel');

                // Fix the UI style
                this._fixUI();

                // Change panel direction
                this._panelDirection = -1;
                break;

            case PANEL_POSITION.BOTTOM:
                // Declare primary monitor resolution size
                let primaryMonitor = this._Main.layoutManager.primaryMonitor.height;
                let panelHeight = this._Panel.height;

                // Set position to bottom
                this._Main.layoutManager.panelBox.set_position(0, primaryMonitor - panelHeight);

                // Add 'no-top-panel' style
                this._Main.layoutManager.uiGroup.add_style_class_name(
                    this._Misc.getSCStyle('no-top-panel', 'all')
                );
                // Add 'bottom-panel' style to make panel menu move closer to bottom panel
                this._Main.layoutManager.uiGroup.add_style_class_name('bottom-panel');

                // Fix the UI style
                this._fixUI();

                // Change panel direction
                this._panelDirection = 1;
                break;
        }

        // Reposition panel translation when panel is invisible
        if (!this._isVisible())
            this._Main.layoutManager.panelBox.translation_y =
                this._Panel.height * this._panelDirection;

        // Reset auto hide to update barrier position
        if (this._autoHide) {
            this.autoHide(false, true);
            this.autoHide(true, true);
        }

        // Reset show on overview signal (to make it show properly)
        if (this._showOnOverview) {
            this.showOnOverview(false);
            this.showOnOverview(true);
        }


        // Reposition panel translation when panel is invisible
        if (this._autoHide || this._showOnOverview) {
            this._Main.layoutManager.panelBox.translation_y =
                this._Panel.height * this._panelDirection;
        }
    }

    /**
     * Get panel position
     * @returns {PANEL_POSITION}
     */
    _getPosition() {
        // Check panel y position
        let panelYPosition = this._Main.layoutManager.panelBox.get_position()[1];
        return (panelYPosition !== 0) ? PANEL_POSITION.BOTTOM : PANEL_POSITION.TOP;
    }

    /**
     * Get panel visibility state
     * @returns {boolean}
     */
    _isVisible() {
        return this._Panel.visible;
    }
}