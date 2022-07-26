/**
 * Search module
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
 * Search
 *
 * Your system control on the top of display
 *
 * This Module can configure/do:
 * > Show/Hide the search bar
 * > Enable/Disable type to search behavior
 */
var SearchModule = class extends template.ConfigurationModule {
    /**
     * Class constructor
     */
    constructor() {
        super();

        // GI libraries
        this._Clutter = imports.gi.Clutter || null;

        // UI libraries
        this._SearchController = (this._shellVersion >= 40) ? imports.ui.searchController : null;
        this._SearchEntry = this._Main.overview.searchEntry;
        this._ViewSelector =
            (this._shellVersion <= 40) ? this._Main.overview._overview.viewSelector : null;

        // Private declarations
        this._visible = true;
        this._entryHeight = this._SearchEntry.height;
        this._parentHeight = this._SearchEntry.get_parent().height;
    }

    /**
     * Backup shell properties
     * @returns {void}
     */
    backup() {
        super.backup();

        this._origin = {
            'visibility': this._SearchEntry.visible,
            'typeToSearch':
                (this._shellVersion >= 40 && this._SearchController) ?
                    this._SearchController.SearchController.prototype.startSearch
                :   this._ViewSelector.startSearch,
        }
    }

    /**
     * Restore properties
     * @returns {void}
     */
    restore() {
        this.visibility(this._origin['visibility']);
        this.typeToSearch(String(this._origin['typeToSearch']) != '() => {}');
    }

    /**
     * Search entry visibility
     * @param {boolean} state visibility state
     * @returns {void}
     */
    visibility(state) {
        let parent = this._SearchEntry.get_parent();
        let commonAnimationProp = {
            transition: 'easeOutQuad',
            mode: this._Clutter.AnimationMode.EASE_OUT_QUAD,
            time: 100 / 1000,
            duration: 100,
        };

        let show = () => {
            this._SearchEntry.show();
            parent.ease({
                height: this._entryHeight,
                opacity: 255,
                ... commonAnimationProp,
                onComplete: () => {
                    parent.height = -1;
                    this._SearchEntry.ease({
                        opacity: 255,
                        ... commonAnimationProp,
                    });
                }
            });
        }
        let hide = () => {
            this._SearchEntry.ease({
                opacity: 0,
                ... commonAnimationProp,
                onComplete: () => {
                    parent.ease({
                        height: this._entryHeight,
                        opacity: 255,
                        ... commonAnimationProp,
                        onComplete: () => this._SearchEntry.hide()
                    });
                }
            });
        }

        if (state) {
            // Show search entry parent when state is true
            parent.show()
            show();
        } else {
            hide();
        }

        if (!this.temporaryVisible) this._visible = state;
    }

    /**
     * Type to search behavior
     * @param {boolean} state behavior state
     * @returns {void}
     */
    typeToSearch(state) {
        if (state) {
            if (this._shellVersion >= 40 && this._SearchController)
                this._SearchController.SearchController.prototype.startSearch = this._origin['typeToSearch'];
            else
                this._ViewSelector.startSearch = this._origin['typeToSearch'];
        } else {
            if (this._shellVersion >= 40 && this._SearchController)
                this._SearchController.SearchController.prototype.startSearch = () => {};
            else
                this._ViewSelector.startSearch = () => {};
        }
        this._startSearchHandler(state);
    }

    /**
     * Connect start search signal when search entry is hidden
     * @param {boolean} state handler state
     * @returns {void}
     */
    _startSearchHandler(state) {
        let controller =
            (this._shellVersion >= 40) ?
                this._Main.overview._overview.controls._searchController
            :   this._ViewSelector;
        if (state) {
            let usesSearchController = this._shellVersion >= 40 && this._SearchController;
            let signalName = (usesSearchController) ? 'notify::search-active' : 'page-changed';
            if (!this._searchActiveSignal){
                this._searchActiveSignal = controller.connect(signalName, () => {
                    let inSearch =
                        (usesSearchController) ?
                            controller.searchActive
                        :   controller._searchActive
                    // Only affected when parent of search visibility is hidden
                    this.temporaryVisible = inSearch;
                    if (!this._visible) this.visibility(inSearch);
                });
            }
        } else {
            if (this._searchActiveSignal) {
                controller.disconnect(this._searchActiveSignal);
                delete(this._searchActiveSignal);
            }
        }
    }
}