jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"MyTickets/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"MyTickets/test/integration/pages/App",
	"MyTickets/test/integration/pages/Browser",
	"MyTickets/test/integration/pages/Master",
	"MyTickets/test/integration/pages/Detail",
	"MyTickets/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "MyTickets.view."
	});

	sap.ui.require([
		"MyTickets/test/integration/NavigationJourneyPhone",
		"MyTickets/test/integration/NotFoundJourneyPhone",
		"MyTickets/test/integration/BusyJourneyPhone"
	], function() {
		QUnit.start();
	});
});