jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 TICKETSet in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"MyTickets/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"MyTickets/test/integration/pages/App",
	"MyTickets/test/integration/pages/Browser",
	"MyTickets/test/integration/pages/Master",
	"MyTickets/test/integration/pages/Detail",
	"MyTickets/test/integration/pages/Create",
	"MyTickets/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "MyTickets.view."
	});

	sap.ui.require([
		"MyTickets/test/integration/MasterJourney",
		"MyTickets/test/integration/NavigationJourney",
		"MyTickets/test/integration/NotFoundJourney",
		"MyTickets/test/integration/BusyJourney",
		"MyTickets/test/integration/FLPIntegrationJourney"
	], function() {
		QUnit.start();
	});
});