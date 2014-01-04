'use strict';
define([
  "lib/angular/angular",
  "config/rfz"
], function(
  angular,
  RFZ
) {
/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.

RFZ.factory("model", function() {
  var accounts = [{"payments":[{"amount":891.54,"date":1373353200000},
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
                       "id":93649}];
  var settings = {"billpay":{"enrolled":true,"_meta":{"enrolled":null}},
                  "backbone":{"enrolled":false,"_meta":{"enrolled":null}},
                  "offers":{"enabled":true,"enrolled":true,"_meta":{"enabled":null,"enrolled":null}},
                  "debt-movement":{"enrolled":false,"_meta":{"enrolled":null,"created":null},"created":0},
                  "large-deposit-threshold":{"_meta":{"value":{"group":"4",
                                                               "title":"Large Deposit Amount",
                                                               "type":"currency",
                                                               "mobile":true}},
                                             "value":200.0},
                  "notifications":{"reminders":7,
                                    "offers":false,
                                    "is_summary":false,
                                    "_meta":{"reminders":{"group":"1",
                                                          "title":"Days Before Due Date",
                                                          "type":"number",
                                                          "mobile":true}
,
                                             "offers":null,
                                             "is_summary":null,
                                             "low_checking":{"group":"2",
                                                             "title":"Low Balance Warning",
                                                             "type":"toggle",
                                                             "mobile":true},
                                             "is_reminders":{"group":"1",
                                                             "title":"Payment Reminders",
                                                             "type":"toggle",
                                                             "mobile":true},
                                             "account_milestones":{"group":"5",
                                                                   "title":"Account Milestones",
                                                                   "type":"toggle",
                                                                   "mobile":true},
                                             "plan_change":null,
                                             "large_purchase":{"group":"3",
                                                               "title":"Large Purchase Alert",
                                                               "type":"toggle",
                                                               "mobile":true},
                                             "apr_change":{"group":"5",
                                                           "title":"APR Changes",
                                                           "type":"toggle",
                                                           "mobile":true},
                                             "announcement_emails":{"title":"Product Updates and Announcements",
                                                                    "type":"toggle",
                                                                    "mobile":false},
                                             "summary":null,
                                             "large_deposit":{"group":"4",
                                                              "title":"Large Deposit Alert",
                                                              "type":"toggle",
                                                              "mobile":true}},
                                    "low_checking":false,
                                    "is_reminders":false,
                                    "account_milestones":false,
                                    "plan_change":false,
                                    "large_purchase":false,
                                    "apr_change":false,
                                    "announcement_emails":false,
                                    "summary":"weekly",
                                    "large_deposit":false},
                  "low-checking-threshold":{"_meta":{"value":{"group":"2",
                                                              "title":"Low Balance Amount",
                                                              "type":"currency",
                                                              "mobile":true}},
                                            "value":200.0},
                  "progress-reports":{"enabled":false,"_meta":{"enabled":null}},
                  "calendar-sync":{"enabled":false,"_meta":{"enabled":null}},
                  "large-purchase-threshold":{"_meta":{"value":{"group":"3",
                                                                "title":"Large Purchase Amount",
                                                                "type":"currency",
                                                                "mobile":true}},
                                              "value":200.0}}
  return {accounts : accounts,
          change : function(cb) {
            console.log("changing");
            accounts[0].isTarget = !accounts[0].isTarget;
            accounts[1].isTarget = !accounts[1].isTarget;
            cb();
          }};
});


});
