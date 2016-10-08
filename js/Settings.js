'use strict';

var
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	ServerModuleName: 'StandardAuth',
	HashModuleName: 'standardauth',
	
	userAccountsCount: ko.observable(0),
	
	/**
	 * Initializes settings.
	 */
	init: function ()
	{
		App.registerUserAccountsCount(this.userAccountsCount);
	}
};