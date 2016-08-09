'use strict';


module.exports = function (oAppData, iUserRole, bPublic) {
	var
		TextUtils = require('modules/CoreClient/js/utils/Text.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		
		bAdminUser = iUserRole === Enums.UserRole.SuperAdmin,
		bPowerUser = iUserRole === Enums.UserRole.PowerUser
	;
	
	if (bAdminUser)
	{
		return {
			/**
			 * Runs after app initializing. Adds standard auth tab to admin panel.
			 * 
			 * @param {Object} ModulesManager Modules manager object.
			 */
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function () { return require('modules/%ModuleName%/js/views/AccountsSettingsView.js'); },
					Settings.HashModuleName + '-accounts',
					TextUtils.i18n('%MODULENAME%/LABEL_BASIC_ACCOUNTS_TAB')
				]);
			}
		};
	}
	
	if (bPowerUser)
	{
		return {
			/**
			 * Runs after app initializing. Adds standard auth tab to user settings.
			 * 
			 * @param {Object} ModulesManager Modules manager object.
			 */
			start: function (ModulesManager) {
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
					function () { return require('modules/%ModuleName%/js/views/AccountsSettingsView.js'); },
					Settings.HashModuleName + '-accounts',
					TextUtils.i18n('%MODULENAME%/LABEL_BASIC_ACCOUNTS_TAB')
				]);
			}
		};
	}
	
	return null;
};
