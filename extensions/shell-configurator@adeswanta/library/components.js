/**
 * SCComponents
 * Shell components for configuring shell properties and make it compatible
 *
 * @author      Advendra Deswanta <adeswanta@gmail.com>
 * @copyright   2021-2022
 * @license     GPL-3.0-only
 */

const Self = imports.misc.extensionUtils.getCurrentExtension();
const {
    main:Main,
    panel:Panel,
    dash:Dash,
    overview:Overview,
    workspace:Workspace,
    search:Search,
    app_grid:AppGrid,
    looking_glass:LookingGlass,
    notification:Notification,
    osd:OSD,
    screenshot:Screenshot
} = Self.imports.library.modules;

/**
 * SCComponents
 *
 * Shell components for configuring shell properties and make it compatible
 */
var SCComponents = class {
    /**
     * Class constructor
     */
    constructor(shellVersion) {
        this._shellVersion = shellVersion;

        this.Main = new Main.MainModule();
        this.Panel = new Panel.PanelModule();
        this.Dash = new Dash.DashModule();
        this.Overview = new Overview.OverviewModule();
        this.Workspace = new Workspace.WorkspaceModule();
        this.Search = new Search.SearchModule();
        this.AppGrid = new AppGrid.AppGridModule();
        this.LookingGlass = new LookingGlass.LookingGlassModule();
        this.Notification = new Notification.NotificationModule();
        this.OSD = new OSD.OSDModule();

        if (this._shellVersion >= 42) {
            this.Screenshot = new Screenshot.ScreenshotModule();
        }
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        this.Main.backup();
        this.Panel.backup();
        this.Dash.backup();
        this.Overview.backup();
        this.Workspace.backup();
        this.Search.backup();
        this.AppGrid.backup();
        this.LookingGlass.backup();
        this.Notification.backup();
        this.OSD.backup();

        if (this._shellVersion >= 42) {
            this.Screenshot.backup();
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.Main.restore();
        this.Panel.restore();
        this.Dash.restore();
        this.Overview.restore();
        this.Workspace.restore();
        this.Search.restore();
        this.AppGrid.restore();
        this.LookingGlass.restore();
        this.Notification.restore();
        this.OSD.restore();

        delete(this.Main);
        delete(this.Panel);
        delete(this.Dash);
        delete(this.Overview);
        delete(this.Workspace);
        delete(this.Search);
        delete(this.AppGrid);
        delete(this.LookingGlass);
        delete(this.Notification);
        delete(this.OSD);

        if (this._shellVersion >= 42) {
            this.Screenshot.restore();
            delete(this.Screenshot);
        }
    }
}