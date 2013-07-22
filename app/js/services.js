'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.

services.factory("model", function() {
  return {accounts : [{"payments":[{"amount":891.54,"date":1373353200000},
                                    {"amount":382.64,"date":1370588400000},
                                    {"amount":1000.0,"date":1370588400000},
                                    {"amount":9.19,"date":1348642800000}],
                        "balance":576.75,
                        "lastUpdated":1374525946000,
                        "name":"Citi ThankYou Preferred Card 2 (7874)",
                        "isBillpayEnabled":false,
                        "progressDescription":"This is your target account because it has the highest interest rate.",
                        "isTarget":true,
                        "totalPaid":11791.179999999995,
                        "paidOff":false,
                        "type":"Credit Card",
                        "apr":19.99,
                       "id":93641},
                      {"payments":[],
                       "balance":2083.04,
                       "lastUpdated":1374525881000,
                       "name":"JetBlue Card (1000)",
                       "isBillpayEnabled":true,
                       "progressDescription":"",
                       "isTarget":false,
                       "totalPaid":0,
                       "paidOff":false,
                       "type":"Credit Card",
                       "apr":15.24,
                       "id":206447},
                      {"payments":[],
                       "balance":31374.16,
                       "lastUpdated":1374525901000,
                       "name":"MyAccess Checking (0785)",
                       "isBillpayEnabled":true,
                       "progressDescription":"",
                       "isTarget":false,
                       "totalPaid":0,
                       "paidOff":false,
                       "type":"Checking/Savings",
                       "apr":0.0,
                       "id":93649}]}
});


