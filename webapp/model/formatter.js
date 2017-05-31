sap.ui.define([], function() {
	"use strict";

return {
	status : function (sStatus) {
	    if(sStatus == "1") {
	        return "Success"; 
	    }
	    else if (sStatus == "2") {
	        return "Warning";
	    }
	    else if (sStatus == "3") {
	        return "Error";
	    }
	    else
	    {
	        return "None"; 
	    }
	}
};
});