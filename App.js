//API Docs: https://help.rallydev.com/apps/2.1/doc/
// Custom Rally App that displays Defects in a grid and filter by Iteration and/or Severity.
//
// Note: various console debugging messages intentionally kept in the code for learning purposes
Ext.define('CustomApp', {
    extend: 'Rally.app.App',      // The parent class manages the app 'lifecycle' and calls launch() when ready
    componentCls: 'app',          // CSS styles found in app.css

    items: [      // pre-define the general layout of the app; the skeleton (ie. header, content, footer)
        {
            xtype: 'container', // this container lets us control the layout of the pulldowns; they'll be added below
            itemId: 'pulldown-container',
            layout: {
                type: 'hbox',           // 'horizontal' layout
                align: 'stretch'
            }
        }
    ],
    defectStore: undefined,       // app level references to the store and grid for easy access in various methods
    defectGrid: undefined,

    // Entry Point to App
    launch: function() {
        var me = this;                     // convention to hold a reference to the 'app' itself; reduce confusion of 'this' all over the place; when you see 'me' it means the 'app'
        console.log('our second app');     // see console api: https://developers.google.com/chrome-developer-tools/docs/console-api
        me._loadIterations();
    },

    // create and load iteration pulldown
    _loadIterations: function() {
        var me = this;

        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox', {
            itemId: 'iteration-combobox',     // we'll use this item ID later to get the users' selection
            fieldLabel: 'Iteration',
            labelAlign: 'right',
            width: 300,
            listeners: {
                ready: me._loadSeverities,      // initialization flow: next, load severities
                select: me._loadData,           // user interactivity: when they choose a value, (re)load the data
                scope: me
            }
        });

        this.down('#pulldown-container').add(iterComboBox);  // add the iteration list to the pulldown container so it lays out horiz, not the app!
    },

    // create defect severity pulldown then load data
    _loadSeverities: function() {
        var me = this;
        var severityComboBox = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
            itemId: 'severity-combobox',
            model: 'Defect',
            field: 'Severity',
            fieldLabel: 'Severity',
            labelAlign: 'right',
            listeners: {
                ready: me._loadData,        // initialization flow: when this is ready, we're done and can load all data
                select: me._loadData,       // user interactivity: when they choose a value, (re)load the data
                scope: me                            // <--- don't for get to pass the 'app' level scope into the combo box so the async event functions can call app-level func's!
            }

        });

        this.down('#pulldown-container').add(severityComboBox); // add the severity list to the pulldown container so it lays out horiz, not the app!
    },

    // construct filters for defects with given iteration (ref) /severity values
    _getFilters: function(iterationValue, severityValue) {

        var iterationFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Iteration',
            operation: '=',
            value: iterationValue
        });

        var severityFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'Severity',
            operation: '=',
            value: severityValue
        });

        return iterationFilter.and(severityFilter);

        // EXTRA EXAMPLE showing AND + OR combination; (commented code only)
        /*
         var blockedFilter = Ext.create('Rally.data.wsapi.Filter', {
         property: 'Blocked',
         operation: '=',
         value: true
         });

         var iterationSeverityFilter = iterationFilter.and(severityFilter);
         var myFilters = blockedFilter.or(iterationSeverityFilter);
         return myFilters;
         */

    },

    // Get data from Rally
    _loadData: function() {

        var me = this;

        // lookup what the user chose from each pulldown
        var selectedIterRef = this.down('#iteration-combobox').getRecord().get('_ref');              // the _ref is unique, unlike the iteration name that can change; lets query on it instead!
        var selectedSeverityValue = this.down('#severity-combobox').getRecord().get('value');   // remember to console log the record to see the raw data and relize what you can pluck out
        // filters to send to Rally during the store load
        var myFilters = this._getFilters(selectedIterRef, selectedSeverityValue);

        console.log('my filter', myFilters.toString());

        // if store exists, just load new data
        if (me.defectStore) {
            console.log('store exists');
            me.defectStore.setFilter(myFilters);
            me.defectStore.load();

            // create store
        } else {
            console.log('creating store');
            me.defectStore = Ext.create('Rally.data.wsapi.Store', {     // create defectStore on the App (via this) so the code above can test for it's existence!
                model: 'Defect',
                autoLoad: true,                         // <----- Don't forget to set this to true! heh
                filters: myFilters,
                listeners: {
                    load: function(myStore, myData, success) {
                        console.log('got data!', myStore, myData);
                        if (!me.defectGrid) {           // only create a grid if it does NOT already exist
                            me._createGrid(myStore);      // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
                        }
                    },
                    scope: me                         // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
                },
                fetch: ['FormattedID', 'Name', 'Severity', 'Iteration']   // Look in the WSAPI docs online to see all fields available!
            });
        }
    },

    // Create and Show a Grid of given defect
    _createGrid: function(myDefectStore) {

        var me = this;

        me.defectGrid = Ext.create('Rally.ui.grid.Grid', {
            store: myDefectStore,
            columnCfgs: [         // Columns to display; must be the same names specified in the fetch: above in the wsapi data store
                'FormattedID', 'Name', 'Severity', 'Iteration'
            ]
        });

        me.add(me.defectGrid);       // add the grid Component to the app-level Container (by doing this.add, it uses the app container)

    }

});