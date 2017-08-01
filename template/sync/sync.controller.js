'use strict';

/* Sync Controller */

app.controller('syncCtrl', function($q, $scope, storage, backdrop, Store, Branch, Reason, DBAccess, Log, Toast) {
    /* Get store id */
    var store_id = storage.read('store_id').store_id;

    /* Sync Store  */
    $scope.syncStore = function() {

        /* Intialize timeout for showing backdrop and sync based on xhr success 
           $scope.timeout = N of xhr
           $scope.timeout = -1 if error on xhr
           Set $scope.timeout to 0 of and increment as xhr success
           Change val to N of xhr
        */
        $scope.timeout = 0;
        backdrop.show();
        $scope.$watch('timeout', function(val) {
            if (val == 3) {
                backdrop.hide();
                Toast.show("Syncing store data successful");
            } else if (val == -1) {
                backdrop.hide();
                Toast.show("Unable to connect to server");
            }
        });

        /* Get store info */
        Store.get({ id: store_id }, function(res) {
            var response = res;
            $scope.timeout++;
            DBAccess.execute('SELECT COUNT(*) as count FROM store_info', []).then(function(res) {
                if (res[0].count == 0) {
                    var insert = "INSERT INTO store_info (store_id, store_code, store_name, company, location, bank) VALUES (?,?,?,?,?,?)";
                    var param = [response.store_id, response.store_code, response.store_name, response.company, response.location, response.bank.join()];
                    DBAccess.execute(insert, param);
                } else {
                    var update = "UPDATE store_info SET store_code = ?, store_name = ?, company = ?, location = ? , bank = ? WHERE store_id = ?";
                    var param = [response.store_code, response.store_name, response.company, response.location, response.bank.join(), parseInt(store_id)];
                    DBAccess.execute(update, param);
                }
            }, function(err) {
                Log.write(err);
            });
        }, function(err) {
            $scope.timeout = -1;
            Log.write(err);
        });

        /* Get branch info */
        Branch.get({ id: store_id }, function(res) {
            var response = res;
            $scope.timeout++;
            if (response.length != 0) {
                angular.forEach(response, function(value) {
                    DBAccess.execute('SELECT * FROM branch_info WHERE _id = ?', [value.store_id]).then(function(res) {
                        if (res.length == 0) {
                            var insert = "INSERT INTO branch_info (_id, store_name) VALUES (?,?)";
                            DBAccess.execute(insert, [value.store_id, value.store_name]);
                        } else {
                            var update = "UPDATE branch_info SET store_name = ? WHERE _id = ?";
                            DBAccess.execute(update, [value.store_name, value.store_id]);
                        }
                    }, function(err) {
                        Log.write(err);
                    });
                });
            }
        }, function(err) {
            $scope.timeout = -1;
            Log.write(err);
        });

        /* Get reason data */
        Reason.get({ id: store_id }, function(res) {
            var response = res;
            $scope.timeout++;
            if (response.length != 0) {
                angular.forEach(response, function(value) {
                    DBAccess.execute('SELECT * FROM reason WHERE _id = ?', [value.id]).then(function(res) {
                        if (res.length == 0) {
                            var insert = "INSERT INTO reason (_id, module, reason) VALUES (?,?,?)";
                            DBAccess.execute(insert, [value.id, value.module, value.text]);
                        } else {
                            var update = "UPDATE reason SET  module = ?, reason = ? WHERE _id = ?";
                            DBAccess.execute(update, [value.module, value.text, value.id]);
                        }
                    }, function(err) {
                        Log.write(err);
                    });
                });
            }
        }, function(err) {
            $scope.timeout = -1;
            Log.write(err);
        });
    };


});