Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function () {
        //API Docs: https://help.rallydev.com/apps/2.1/doc/

        //Write app code here
        this._loadData();
    },

    // Get data from Rally
    _loadData: function () {
        var myStore = Ext.create('Rally.data.wsapi.artifact.Store', {
            models: ['Defect', 'DefectSuite', 'UserStory'],
            autoLoad: true,
            listeners: {
                load: function (myStore, myData, success) {
                    //process data
                    console.log("got data", myStore, myData, success)
                    this._loadGrid();
                    console.log("What is this", this);
                },
                scope: this
            },
            fetch: ['FormattedID', 'Name', 'ScheduleState']
        });
    },

    // Create and show grid
    _loadGrid: function (myStoryStore) {
        var myGrid = Ext.create('Rally.ui.grid.Grid', {
            store: myStoryStore,
            columnCfgs: [
                'FormattedID',
                'Name',
                'ScheduleState',
                'Owner'
            ],
            storeConfig: {
                model: 'userstory'
            }
        });
        this.add(myGrid);
        console.log("Grid added");
    }
});