/**
 * Workspace module
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
 * Workspace
 *
 * Organize active windows
 *
 * This Module can configure/do:
 * > Set workspace background uniform scaling (GNOME 40 above)
 * > Show/Hide workspace background (GNOME 40 below)
 * > Show/Hide the workspace switcher
 * > Show/Hide static background to workspace switcher (GNOME 40 above)
 * > Set the workspace switcher peek (GNOME 3.38 below)
 * > Set the workspace switcher scale (GNOME 40 above)
 * > Set the wraparound workspace switcher behavior
 * > Always show workspace switcher (GNOME 40 above)
 * > Set the workspace background border radius (GNOME 40 above)
 */
var WorkspaceModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Meta = imports.gi.Meta || null;

        // UI libraries
        this._OverviewControls = imports.ui.overviewControls || null;
        this._Workspace = imports.ui.workspace || null;
        this._WorkspacesView = imports.ui.workspacesView || null;
        this._WorkspaceThumbnail = imports.ui.workspaceThumbnail || null;
        this._Background = imports.ui.background || null;

        // Private declarations
        this._backgroundManagers = [];
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'backgroundVisibility':
                (this._shellVersion >= 40) ? this._Workspace.Workspace.prototype._init :null,
            'backgroundUniformScale':
                (this._shellVersion >= 40) ?
                    this._WorkspacesView.WorkspacesView.prototype._updateWorkspacesState
                :   null,
            'switcherVisibility':
                (this._shellVersion <= 3.38) ?
                    this._OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut
                :   this._switcherScaleIsZero(),
            'switcherStaticBackground':
                (this._shellVersion >= 40) ?
                    this._WorkspaceThumbnail.WorkspaceThumbnail.prototype._init
                :   null,
            'switcherPeekWidth':
                (this._shellVersion <= 3.38) ?
                    this._OverviewControls.ThumbnailsSlider.prototype.getNonExpandedWidth
                :   null,
            'switcherScaleSize':
                (this._shellVersion >= 40) ?
                    this._WorkspaceThumbnail.MAX_THUMBNAIL_SCALE
                :   null,
            'wraparoundSwitching': this._Meta.Workspace.prototype.get_neighbor,
            'alwaysShowWorkspaceSwitcher':
                (this._shellVersion >= 40) ?
                    this._WorkspaceThumbnail.ThumbnailsBox.prototype._updateShouldShow
                :   null,
            'backgroundBorderRadius':
                (this._shellVersion >= 40) ?
                    this._Workspace.WorkspaceBackground.prototype._updateBorderRadius
                :   null,
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.switcherVisibility(true);

        if (this._shellVersion >= 40) {
            this.backgroundVisibility(true);
            this.backgroundUniformScale(false);
            this.switcherStaticBackground(false);
            this.switcherScaleSize(this._origin['switcherScaleSize'] * 100, false);
            this.alwaysShowWorkspaceSwitcher(false);
            this.backgroundBorderRadius(-1);
        } else {
            this.switcherPeekWidth(-1);
        }

        this.wraparoundSwitching(false);
    }

    /**
     * Forked from library.modules.overview.staticDesktopBackground
     * @param {boolean} state temporary state
     */
    _addTemporaryStaticBackground(state) {
        let addBackgrounds = () => {
            // Add backgrounds on every monitor
            this._Main.layoutManager.monitors.forEach( monitor => {
                // Create new background manager and push it
                let backgroundManager = new this._Background.BackgroundManager({
                    monitorIndex: monitor.index,
                    container: this._Main.layoutManager.overviewGroup
                });
                this._backgroundManagers.push(backgroundManager);

                let backgroundActor = backgroundManager.backgroundActor;
                let adjustment = this._Main.overview._overview._controls._stateAdjustment;

                // We add private property for fade signal
                backgroundManager._fadeSignal = adjustment.connect('notify::value', (v) => {
                    backgroundActor.opacity = this._Util.lerp(255, 0, Math.min(v.value, 1));
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

    /**
     * Workspace background visibility and disable workspace scaling
     * @param {boolean} state background visibility state
     */
    backgroundVisibility(state) {
        if (this._shellVersion >= 40) {
            let adjustment = this._Main.overview._overview._controls._stateAdjustment;

            if (state) {
                this._addTemporaryStaticBackground(false);

                // Restore element opacity state
                if (this._elementFadeSignal) {
                    adjustment.disconnect(this._elementFadeSignal);
                    delete(this._elementFadeSignal);
                }
                this._Main.overview.dash.opacity = 255;
                this._Main.overview.searchEntry.get_parent().opacity = 255;

                this._Workspace.Workspace.prototype._init = this._origin['backgroundVisibility'];
            } else {
                this._addTemporaryStaticBackground(true);

                // Fade the element when the overview state changes
                if (!this._elementFadeSignal) {
                    this._elementFadeSignal = adjustment.connect('notify::value', (v) => {
                        let fadeVal = this._Util.lerp(0, 255, Math.min(v.value, 1));
                        this._Main.overview.dash.opacity = fadeVal;
                        this._Main.overview.searchEntry.get_parent().opacity = fadeVal;
                        this._Main.overview._overview.controls._thumbnailsBox.opacity = fadeVal;
                    });
                }

                // We use scoped constant value to link those variables
                const { St, Graphene, Clutter, GObject } = imports.gi;
                const Main = this._Main;
                const WorkspaceLayout = imports.ui.workspace.WorkspaceLayout;
                const shellVersion = this._shellVersion;

                this._Workspace.Workspace.prototype._init =
                    function (metaWorkspace, monitorIndex, overviewAdjustment) {
                        St.Widget.prototype._init.call(this, {
                            style_class: 'window-picker',
                            pivot_point: new Graphene.Point({ x: 0.5, y: 0.5 }),
                            layout_manager: new Clutter.BinLayout(),
                        });

                        const layoutManager = new WorkspaceLayout(metaWorkspace, monitorIndex,
                            overviewAdjustment);

                        // Window previews
                        this._container = new Clutter.Actor({
                            reactive: true,
                            x_expand: true,
                            y_expand: true,
                        });
                        this._container.layout_manager = layoutManager;
                        this.add_child(this._container);

                        this.metaWorkspace = metaWorkspace;

                        if (shellVersion <= 41) {
                            this._activeWorkspaceChangedId =
                                (this.metaWorkspace) ?
                                    this.metaWorkspace.connect('notify::active', () => {
                                        layoutManager.syncOverlays();
                                    })
                                :   null;
                        }

                        this._overviewAdjustment = overviewAdjustment;

                        this.monitorIndex = monitorIndex;
                        this._monitor = Main.layoutManager.monitors[this.monitorIndex];

                        if (monitorIndex != Main.layoutManager.primaryIndex)
                            this.add_style_class_name('external-monitor');

                        const clickAction = new Clutter.ClickAction();
                        clickAction.connect('clicked', action => {
                            // Switch to the workspace when not the active one, leave the
                            // overview otherwise.
                            if (action.get_button() === 1 || action.get_button() === 0) {
                                const leaveOverview = this._shouldLeaveOverview();

                                if (this.metaWorkspace)
                                    this.metaWorkspace.activate(global.get_current_time());

                                if (leaveOverview)
                                    Main.overview.hide();
                            }
                        });
                        this.bind_property('mapped', clickAction, 'enabled', GObject.BindingFlags.SYNC_CREATE);
                        this._container.add_action(clickAction);

                        this.connect('style-changed', this._onStyleChanged.bind(this));
                        this.connect('destroy', this._onDestroy.bind(this));

                        this._skipTaskbarSignals = new Map();
                        const windows = global.get_window_actors().map(a => a.meta_window)
                            .filter(this._isMyWindow, this);

                        // Create clones for windows that should be
                        // visible in the Overview
                        this._windows = [];
                        for (let i = 0; i < windows.length; i++) {
                            if (this._isOverviewWindow(windows[i]))
                                this._addWindowClone(windows[i]);
                        }

                        // Track window changes, but let the window tracker process them first
                        if (shellVersion >= 42) {
                            if (this.metaWorkspace) {
                                this.metaWorkspace.connectObject(
                                    'window-added',
                                    this._windowAdded.bind(this), GObject.ConnectFlags.AFTER,

                                    'window-removed',
                                    this._windowRemoved.bind(this), GObject.ConnectFlags.AFTER,

                                    'notify::active', () => layoutManager.syncOverlays(), this
                                );
                            }
                            global.display.connectObject(
                                'window-entered-monitor',
                                this._windowEnteredMonitor.bind(this), GObject.ConnectFlags.AFTER,

                                'window-left-monitor',
                                this._windowLeftMonitor.bind(this), GObject.ConnectFlags.AFTER,

                                this
                            );
                        } else {
                            if (this.metaWorkspace) {
                                this._windowAddedId = this.metaWorkspace.connect_after(
                                    'window-added', this._windowAdded.bind(this));
                                this._windowRemovedId = this.metaWorkspace.connect_after(
                                    'window-removed', this._windowRemoved.bind(this));
                            }
                            this._windowEnteredMonitorId = global.display.connect_after(
                                'window-entered-monitor', this._windowEnteredMonitor.bind(this));
                            this._windowLeftMonitorId = global.display.connect_after(
                                'window-left-monitor', this._windowLeftMonitor.bind(this));
                            this._layoutFrozenId = 0;
                        }

                        // DND requires this to be set
                        this._delegate = this;
                    }
            }
        }
    }

    /**
     * Set the scale size of workspaces to the same size as current workspace
     * @param {boolean} state uniform scale state
     */
    backgroundUniformScale(state) {
        if (this._shellVersion >= 40) {
            if (state) {
                // We use scoped constant value to link this variable
                const Util = imports.misc.util;

                this._WorkspacesView.WorkspacesView.prototype._updateWorkspacesState = function () {
                    const adj = this._scrollAdjustment;
                    const fitMode = this._fitModeAdjustment.value;

                    const { initialState, finalState, progress } =
                        this._overviewAdjustment.getStateTransitionParams();

                    const workspaceMode = (1 - fitMode) * Util.lerp(
                        this._getWorkspaceModeForOverviewState(initialState),
                        this._getWorkspaceModeForOverviewState(finalState),
                        progress);

                    // Set the state adjustment value
                    this._workspaces.forEach((w, index) => {
                        w.stateAdjustment.value = workspaceMode;

                        const distanceToCurrentWorkspace = Math.abs(adj.value - index);

                        const scaleProgress = Math.clamp(distanceToCurrentWorkspace, 0, 1);

                        // To avoid user confused with current active workspace when workspace is
                        // in fit mode, We use opacity to determine the current active workspace
                        w.opacity = Util.lerp(255, 180, scaleProgress * fitMode);
                    });
                }
            } else {
                this._WorkspacesView.WorkspacesView.prototype
                    ._updateWorkspacesState = this._origin['backgroundUniformScale'];
            }
        }
    }

    /**
     * Workspace switcher visibility
     * @param {boolean} state switcher visibility state
     * @param {number} originSize original switcher size
     * @returns {void}
     */
    switcherVisibility(state, originSize) {
        if (state) {
            if (this._shellVersion >= 40) {
                // Set scale size to previous size
                this.switcherScaleSize(originSize, true);

                // Remove 'hidden-workspace-switcher' style
                this._Main.layoutManager.uiGroup.remove_style_class_name(
                    this._Misc.getSCStyle('hidden-workspace-switcher', '40')
                );
            } else {
                // Make thumbnail slider trigger again like previous.
                this._OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut =
                    this._origin['switcherVisibility'];

                // Set peek width to previous width
                this.switcherPeekWidth(originSize);

                // Remove 'hidden-workspace-switcher' style
                this._Main.layoutManager.uiGroup.remove_style_class_name(
                    this._Misc.getSCStyle('hidden-workspace-switcher', '3.38')
                );
            }
        } else {
            if (this._shellVersion >= 40) {
                // Set scale size to 0
                this.switcherScaleSize(0, true);

                // Add 'hidden-workspace-switcher' style to make workspace indicator not shown
                this._Main.layoutManager.uiGroup.add_style_class_name(
                    this._Misc.getSCStyle('hidden-workspace-switcher', '40')
                );
            } else {
                // Make thumbnail slider didn't trigger
                this._OverviewControls.ThumbnailsSlider.prototype._getAlwaysZoomOut = () => {
                    return false;
                };

                // Set peek width to 0
                this.switcherPeekWidth(0);

                // Add 'hidden-workspace-switcher' style
                this._Main.layoutManager.uiGroup.add_style_class_name(
                    this._Misc.getSCStyle('hidden-workspace-switcher', '3.38')
                );
            }
        }
    }

    /**
     * Always show the workspace switcher when there's only single workspace
     * @param {boolean} state always show state
     */
    alwaysShowWorkspaceSwitcher(state) {
        let thumbnailSliderProto = this._WorkspaceThumbnail.ThumbnailsBox.prototype;
        if (state) {
            thumbnailSliderProto._updateShouldShow = function () {
                if (!this._shouldShow) {
                    this._shouldShow = true;
                    this.notify('should-show');
                }
            }
        } else {
            thumbnailSliderProto._updateShouldShow = this._origin['alwaysShowWorkspaceSwitcher'];
        }
    }

    /**
     * Restore workspace switcher static background
     * @param {boolean} state switcher static background state
     */
    switcherStaticBackground(state) {
        if (this._shellVersion >= 40) {
            if (state) {
                // We use scoped constant value to link those variables
                const { main:Main, background:Background } = imports.ui;
                const { St, Graphene, Clutter } = imports.gi;
                const ThumbnailState = this._WorkspaceThumbnail.ThumbnailState;
                const shellVersion = this._shellVersion;

                this._WorkspaceThumbnail.WorkspaceThumbnail.prototype._init =
                    function (metaWorkspace, monitorIndex) {
                        St.Widget.prototype._init.call(this, {
                            clip_to_allocation: true,
                            style_class: 'workspace-thumbnail',
                            pivot_point: new Graphene.Point({ x: 0.5, y: 0.5 }),
                        });
                        this._delegate = this;

                        this.metaWorkspace = metaWorkspace;
                        this.monitorIndex = monitorIndex;

                        this._removed = false;

                        this._viewport = new Clutter.Actor();
                        this.add_child(this._viewport);

                        this._contents = new Clutter.Actor();
                        this._viewport.add_child(this._contents);

                        this.connect('destroy', this._onDestroy.bind(this));

                        let workArea = Main.layoutManager.getWorkAreaForMonitor(this.monitorIndex);
                        this.setPorthole(workArea.x, workArea.y, workArea.width, workArea.height);

                        let windows = global.get_window_actors().filter(actor => {
                            let win = actor.meta_window;
                            return win.located_on_workspace(metaWorkspace);
                        });

                        // Create clones for windows that should be visible in the Overview
                        this._windows = [];
                        this._allWindows = [];
                        this._minimizedChangedIds = (shellVersion <= 41) ? [] : null;
                        for (let i = 0; i < windows.length; i++) {
                            if (shellVersion >= 42) {
                                windows[i].meta_window.connectObject('notify::minimized',
                                    this._updateMinimized.bind(this), this);
                            } else {
                                let minimizedChangedId =
                                    windows[i].meta_window.connect('notify::minimized',
                                                                this._updateMinimized.bind(this));
                                this._allWindows.push(windows[i].meta_window);
                                this._minimizedChangedIds.push(minimizedChangedId);
                            }
                            this._allWindows.push(windows[i].meta_window);

                            if (this._isMyWindow(windows[i]) && this._isOverviewWindow(windows[i]))
                                this._addWindowClone(windows[i]);
                        }

                        // Track window changes
                        if (shellVersion >= 42) {
                            this.metaWorkspace.connectObject(
                                'window-added', this._windowAdded.bind(this),
                                'window-removed', this._windowRemoved.bind(this), this);
                            global.display.connectObject(
                                'window-entered-monitor', this._windowEnteredMonitor.bind(this),
                                'window-left-monitor', this._windowLeftMonitor.bind(this), this);
                        } else {
                            this._windowAddedId = this.metaWorkspace.connect(
                                'window-added',
                                this._windowAdded.bind(this)
                            );
                            this._windowRemovedId = this.metaWorkspace.connect(
                                'window-removed',
                                this._windowRemoved.bind(this)
                                );
                            this._windowEnteredMonitorId = global.display.connect(
                                'window-entered-monitor',
                                this._windowEnteredMonitor.bind(this)
                            );
                            this._windowLeftMonitorId = global.display.connect(
                                'window-left-monitor',
                                this._windowLeftMonitor.bind(this)
                            );
                        }

                        this.state = ThumbnailState.NORMAL;
                        this._slidePosition = 0; // Fully slid in
                        this._collapseFraction = 0; // Not collapsed

                        // Add static background to thumbnail content
                        this._bgManager = new Background.BackgroundManager({
                            monitorIndex: monitorIndex,
                            container: this._contents,
                            vignette: false
                        });
                    };
            } else {
                this._WorkspaceThumbnail.WorkspaceThumbnail.prototype
                    ._init = this._origin['switcherStaticBackground'];
            }
        }
    }

    /**
     * Workspace switcher peek width when it isn't in expanded state
     * Only works for GNOME Shell 3.x only
     * @param {number} width switcher peek size
     * @returns {void}
     */
    switcherPeekWidth(width) {
        if (this._shellVersion <= 3.38) {
            if (width == -1) {
                // Set peek width to previous width
                this._OverviewControls.ThumbnailsSlider.prototype.getNonExpandedWidth =
                    this._origin['switcherPeekWidth'];
            } else if (width >= 0 && width <= 96) {
                // Set peek width by returning user value
                this._OverviewControls.ThumbnailsSlider.prototype.getNonExpandedWidth = () => {
                    return width;
                }
            }
        }
    }

    /**
     * Workspace switcher scale size on the top of overview on overview state
     * Only works for GNOME Shell 4x only
     * @param {number} percentage switcher scale size
     * @param {boolean} unlimited force size unlimited
     * @returns {void}
     */
    switcherScaleSize(percentage, unlimited) {
        if (this._shellVersion >= 40) {
            // It use for temporary
            if (unlimited) {
                this._WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = percentage / 100;
                return;
            }
            if (percentage >= 2 && percentage <= 10) {
                // Set scale size by changing maximum scale size
                this._WorkspaceThumbnail.MAX_THUMBNAIL_SCALE = percentage / 100;
            }
        }
    }

    /**
     * Check if workspace switcher scale size is 0 (zero)
     * Only works for GNOME Shell 4x only
     * @returns {boolean}
     */
    _switcherScaleIsZero() {
        // Check by getting MAX_THUMBNAIL_SCALE variable from WorkspaceThumbnail library
        if (this._shellVersion >= 40) {
            if (this._WorkspaceThumbnail.MAX_THUMBNAIL_SCALE >= 0.02) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * Enable wraparound switching of workspace
     * @param {boolean} state wraparound switching state
     */
    wraparoundSwitching(state) {
        // We modify the Meta.Workspace.get_neighbor method to make it work by returning the
        // first workspace index if the current workspace index is the last one and vice versa.
        let metaWorkspaceProto = this._Meta.Workspace.prototype;
        if (state) {
            // We use scoped constant value to link this variable
            const Meta = this._Meta;

            metaWorkspaceProto.get_neighbor = function (direction) {
                let index = this.index();
                let lastIndex = global.workspace_manager.n_workspaces - 1;

                let neighborIndex;
                if (
                    direction === Meta.MotionDirection.UP ||
                    direction === Meta.MotionDirection.LEFT
                ) {
                    // Previous index
                    neighborIndex = (index > 0) ? index - 1 : lastIndex;
                } else {
                    // Next index
                    neighborIndex = (index < lastIndex) ? index + 1 : 0;
                }

                return global.workspace_manager.get_workspace_by_index(neighborIndex);
            }
        } else {
            // Set the original method
            metaWorkspaceProto.get_neighbor = this._origin['wraparoundSwitching'];
        }
    }

    /**
     * Workspace background border radius
     * @param {number} size border corner radius
     */
    backgroundBorderRadius(size) {
        if (this._shellVersion >= 40) {
            // Get the workspace background class prototype
            let workspaceBackgroundProto = this._Workspace.WorkspaceBackground.prototype;
            if (size < 0) {
                // Restore to it's original prototype
                workspaceBackgroundProto._updateBorderRadius =
                    this._origin['backgroundBorderRadius'];
            } else {
                // We use scoped constant value to link those variables
                const Util = imports.misc.util;
                const St = imports.gi.St;

                // Forked from ui.workspace._updateBorderRadius method
                // NOTE: we don't use () => {} because this method binds with this module
                workspaceBackgroundProto._updateBorderRadius = function () {
                    const { scaleFactor } = St.ThemeContext.get_for_stage(global.stage);
                    const cornerRadius = scaleFactor * size;

                    const backgroundContent = this._bgManager.backgroundActor.content;
                    backgroundContent.rounded_clip_radius =
                        Util.lerp(0, cornerRadius, this._stateAdjustment.value);
                }
            }
        }
    }
}