'use strict';

/* Services */

var efileServices = angular.module('efileServices', ['ngResource']);

efileServices.factory('SolrResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/solr/:query");
    }
]);

efileServices.factory('ResourceBundleResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/resource/map");
    }
]);

efileServices.factory('CountryResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/reference/country");
    }
]);

efileServices.factory('StateResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/reference/state");
    }
]);

efileServices.factory('ClassInfoResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/resource/classes/map");
    }
]);

efileServices.factory('PropertyResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/property/raa/:markId/:propertyCd");
    }
]);

efileServices.factory('GlobalResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/global/reader/:serialNo");
    }
]);

efileServices.factory('SearchResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/search");
    }
]);


efileServices.factory('SolrEfileTDMarkResource', ['$resource',
    function($resource) {       
        return $resource("", {});
    }
]);


efileServices.factory('RaaResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/mark/:serialNo");
    }
]);

efileServices.factory('RaaMarkResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/markInfo/:serialNo");
    }
]);

efileServices.factory('TrmTrademarkResource', ['$resource',
      function($resource) {
          return $resource("/efile/rest/trmtrademark/mark/:serialNo");
      }
  ]);

efileServices.factory('SignatureResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/tmsignature/raa/:form", {
            id: "@form"
        });
    }
]);

efileServices.factory('SignatureMultipleResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/tmsignature/raa/multiple/:id", {
            id: "@id"
        });
    }
]);

efileServices.factory('RaaMiscellaneousResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/miscellaneous/raa");
    }
]);

/* replacing MiscellaneousResource above */
efileServices.factory('MiscellaneousResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/additionalstmt/miscellaneous/raa");
    }
]);

efileServices.factory('MiscellaneousMultipleResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/additionalstmt/miscellaneous/raa/multiple");
    }
]);

efileServices.factory('MiscellaneousDocResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/additionalstmt/miscellaneous/doc/raa/:id", {
            id: "@id"
        });
    }
]);


efileServices.factory('EmailSignatureRequestResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/tmsignature/email");
    }
]);


/** replacing MiscellaneousDocResource above */
efileServices.factory('RaaMiscellaneousDocResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/miscellaneous/doc/raa");
    }
]);

/* for retrieving trademark info from TRM*/
efileServices.factory('MarkInfo', ['$resource',
    function($resource) {
        return $resource("/efile/rest/trmtrademark/trademark/:serialNo");
    }
]);

/* for retrieving additional attorney info from efile staging*/
efileServices.factory('GetSATInStagingResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa", {}, {'remove': {method: 'DELETE', isArray: false}});
    }
]);

/* for retrieving mark image*/
efileServices.factory('CMSMarkURLResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/cms/mark/url");
    }
]);

/* for retrieving mark image*/
efileServices.factory('CheckCasesAndGetIDsResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/getCases");
    }
]);



efileApp.service('FileUpload', ['$http', '$q', function($http, $q) {
    this.uploadFileToUrl = function(file, uploadUrl) {
        var deferred = $q.defer();
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            })
            .success(function(value) {
                deferred.resolve(value);
            })
            .error(function() {
                deferred.reject();
            });
        return deferred.promise;
    }
}]);


efileServices.factory('CorrespondenceResource', ['$resource',
    function($resource) {
        return $resource("/efile/rest/raa/correspondence");
    }
]);

efileApp.service('AttorneysReviewResource', ['$http', '$q', function($http, $q) {

    this.saveAttorneysReview = function(files, attorneysReviewForm, uploadUrl) {
        var deferred = $q.defer();
        var formData = new FormData();
        
        angular.forEach(files, function (file) {
          formData.append('file', file);
        });
        formData.append('attorneysReviewForm', JSON.stringify(attorneysReviewForm));
        
        $http.post(uploadUrl, formData, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            })
            .success(function(value) {
                deferred.resolve(value);
            })
            .error(function() {
                deferred.reject();
            });
        return deferred.promise;
    }
}]);

efileApp.service('removedAttorneyList', function() {
    var attorneyList = [];

    var setAttorneyList = function(list) {
        attorneyList = [];
        attorneyList = list;
    }

    var getAttorneyList = function() {
        return attorneyList;
    }

    var clearAttorneyList = function(list) {
        attorneyList = [];
    }

    return {
        setAttorneyList : setAttorneyList,
        getAttorneyList : getAttorneyList,
        clearAttorneyList : clearAttorneyList
    }
});


efileApp.service('attorneySearchResultList', function() {
    var attorneySearchResultList = [];

    var setAttorneySearchResultList = function(list) {
       attorneySearchResultList  = [];
       attorneySearchResultList  = list;
    }

    var getAttorneySearchResultList = function() {
        return attorneySearchResultList ;
    }

    var clearAttorneySearchResultList  = function(list) {
        attorneySearchResultList = [];
    }

    return {
        setAttorneySearchResultList : setAttorneySearchResultList,
        getAttorneySearchResultList : getAttorneySearchResultList,
        clearAttorneySearchResultList : clearAttorneySearchResultList
    }
});

efileApp.service('serialNumber', function() {
    var serialNumberList = "";

    var setSerialNumberList = function(number) {
        serialNumberList = number;
    }

    var getSerialNumberList = function() {
        return serialNumberList;
    }

    return {
        setSerialNumberList: setSerialNumberList,
        getSerialNumberList: getSerialNumberList
    }
});


efileApp.service('AppointedATListForMultiCases', function() {
    var attorneyList = [];
    var tmCasesIdList = [];

    var setAppointedATListForMultiCases = function(atList, idList) {
       attorneyList  = [];
       tmCasesIdList = [];
       attorneyList  = atList;
       tmCasesIdList = idList;
    }

    var getAttorneyList = function() {
        return attorneyList ;
    }

    var getTmCasesIdList = function() {
        return tmCasesIdList ;
    }

    var clearAttorneySearchResultList  = function(list) {
        attorneyList  = [];
        tmCasesIdList = [];
    }

    return {
        setAppointedATListForMultiCases : setAppointedATListForMultiCases,
        getAttorneyList : getAttorneyList,
        getTmCasesIdList : getTmCasesIdList,
        clearAttorneySearchResultList : clearAttorneySearchResultList
    }
});

efileApp.service('WithdrawCompleteInfo', function() {
    var primaryAttorneyName = "";
    var oldCourtesyCorrespondenceEmail = "";
    var primaryCorrespondentName = "";
    var newCourtesyCorrespondenceEmail = "";

    var setWithdrawCompleteInfo = function(name1, email1, name2, email2) {
        primaryAttorneyName = "";
        oldCourtesyCorrespondenceEmail = "";
        primaryCorrespondentName = "";
        newCourtesyCorrespondenceEmail = "";
        
        primaryAttorneyName = name1;
        oldCourtesyCorrespondenceEmail = email1;
        primaryCorrespondentName = name2;
        newCourtesyCorrespondenceEmail = email2;
    }

    var setPrimaryAttorneyName = function(name) {
        primaryAttorneyName = "";
        primaryAttorneyName = name;
    }

    var getPrimaryAttorneyName = function() {
        return primaryAttorneyName;
    }

    var setOldCourtesyCorrespondenceEmail = function(email) {
        oldCourtesyCorrespondenceEmail = "";
        oldCourtesyCorrespondenceEmail = email;
    }

    var getOldCourtesyCorrespondenceEmail = function() {
        return oldCourtesyCorrespondenceEmail;
    }

    var setPrimaryCorrespondentName = function(name) {
        primaryCorrespondentName = "";
        primaryCorrespondentName = name;
    }

    var getPrimaryCorrespondentName = function() {
        return primaryCorrespondentName;
    }

    var setNewCourtesyCorrespondenceEmail = function(email) {
        newCourtesyCorrespondenceEmail = "";
        newCourtesyCorrespondenceEmail = email;
    }

    var getNewCourtesyCorrespondenceEmail = function() {
        return newCourtesyCorrespondenceEmail;
    }

    var clearWithdrawCompleteInfo  = function() {
        primaryAttorneyName = "";
        oldCourtesyCorrespondenceEmail = "";
        primaryCorrespondentName = "";
        newCourtesyCorrespondenceEmail = "";
    }

    return {
        setWithdrawCompleteInfo : setWithdrawCompleteInfo,
        setPrimaryAttorneyName : setPrimaryAttorneyName,
        getPrimaryAttorneyName : getPrimaryAttorneyName,
        setOldCourtesyCorrespondenceEmail : setOldCourtesyCorrespondenceEmail,
        getOldCourtesyCorrespondenceEmail : getOldCourtesyCorrespondenceEmail,
        setPrimaryCorrespondentName : setPrimaryCorrespondentName,
        getPrimaryCorrespondentName : getPrimaryCorrespondentName,
        setNewCourtesyCorrespondenceEmail : setNewCourtesyCorrespondenceEmail,
        getNewCourtesyCorrespondenceEmail : getNewCourtesyCorrespondenceEmail,
        clearWithdrawCompleteInfo : clearWithdrawCompleteInfo
    }
});

efileApp.service('SearchSevice', function($location,$http) {
    var searchObject = "";
    var actionType = "";
    var searchType = "";
    var queryString = "";
    var facet = "";
    var pagination = "";
    var sort = "";

    var buildAndExecuteSearchQuery = function(object, sType, aType, $scope) {
        searchType = sType;
        actionType = aType;
        searchObject = object;

        if (searchType === 'SERIAL_NUMBER_SEARCH') {
            queryString = '(serial_num:(' + object.serial_num.join('+') + ')' + '+OR+registration_num:(' + object.serial_num.join('+') + '))';
            facet = getFacetTemplate(1);
        }

        if (searchType === 'MARK_LITERAL_SEARCH') {

            queryString = 'mark_literal:(' + object.mark_literal.join('+') + ')';
            facet = getFacetTemplate(2);
        }

        if (searchType === 'DOCKET_NUMBER_SEARCH') {
            queryString = '(primary_docket_number:(' + object.docket_number.join('+') + ')' + '+OR+secondary_docket_number:(' + object.docket_number.join('+') + '))';
            facet = getFacetTemplate(2);
        }

        if (searchType == 'OWNER_SEARCH') {
            var arr = [];
            var intRegex = /^\d+$/;
            var ownerNm = $.trim(object.owner_nm);
            var ownerAddr = $.trim(object.owner_street_addr);
            var ownerCountry = $.trim(object.country_of_owner);
            var ownerState = $.trim(object.state_of_owner);
            var ownerDomEntityType = $.trim(object.owner_domestic_entity_type);
            var ownerForeignEntityType = $.trim(object.owner_foreign_entity_type);


            if (ownerNm.length > 0) {
                ownerNm = ownerNm.replace(/,/g, " ");
                ownerNm = ownerNm.replace(/[ ]+/g, " ");
                arr.push('owner_nm:(' + ownerNm + ')');
            }

            if (ownerAddr.length > 0) {
                ownerAddr = ownerAddr.split(/\s+/).join(" AND ");
            //    ownerAddr = '+' + ownerAddr;
                arr.push('owner_street_addr:(' + ownerAddr + ')');
            }

            if (ownerCountry.length > 0) {
                arr.push('country_of_owner:' + ownerCountry);
            }

            if (ownerState.length > 0) {
                arr.push('state_of_owner:' + ownerState);
            }

            if (ownerDomEntityType.length > 0) {
                if (intRegex.test(ownerDomEntityType)) {
                    arr.push('owner_entity_type:' + ownerDomEntityType);
                } else {
                    arr.push('owner_entity_type_tx:' + ownerDomEntityType);
                }
            }

            if (ownerForeignEntityType.length > 0) {
                if (intRegex.test(ownerForeignEntityType)) {
                    arr.push('owner_entity_type:' + ownerForeignEntityType);
                } else {
                    arr.push('owner_entity_type_tx:' + ownerForeignEntityType);
                }
            }


            queryString = this.getQuery(arr);
            console.log(queryString);
            facet = getFacetTemplate(3);
        }

        if (searchType == 'LAWFIRM_SEARCH') {
            var arrinput = [];
            //var secArrInput = [];
            var lawFirmName = $.trim(object.LawFirm_Name);
            var lawFirmState = $.trim(object.LawFirm_State);
            var lawFirmEmailAddress = $.trim(object.LawFirm_EmailAddress);
            var lawFirmMarkOwner = $.trim(object.LawFirm_MarkOwner);
            var lawFirmExactFirmName = $.trim(object.LawFirm_ExactFirmName);
            var strSecondaryQuery = '';

            if (lawFirmName.length > 0) {                
                arrinput.push( '(primary_firm_nm:('+ lawFirmName+')+OR+primary_attorney_full_nm:('+lawFirmName+')+OR+Secondary_firm_name:('+ lawFirmName+')+OR+Secondary_attorney_full_name:('+lawFirmName+'))' );
            }

            if (lawFirmState.length > 0) {
                arrinput.push('(primary_state:(' + lawFirmState + ')+OR+secondary_attorney_state:(' + lawFirmState + '))');
                
            }

            if (lawFirmEmailAddress.length > 0) {               
                arrinput.push('(primary_domain_only_email:(' + lawFirmEmailAddress + ')+OR+secondary_attorney_email:(' + lawFirmEmailAddress + '))' );                
            }

            if (lawFirmMarkOwner.length > 0) {
                arrinput.push('owner_nm:(' + lawFirmMarkOwner + ')');
                
            }

            if (lawFirmExactFirmName.length > 0){
                arrinput.push( '(primary_firm_nm:('+ lawFirmExactFirmName+')+OR+primary_attorney_full_nm:('+lawFirmExactFirmName+')+OR+Secondary_firm_name:('+ lawFirmExactFirmName+')+OR+Secondary_attorney_full_name:('+lawFirmExactFirmName+'))' );
               
            }
            queryString = arrinput.toString().replace(/,/g, '+AND+');            
            facet = getFacetTemplate(1);
        }

        // check solr return
        var query ='/efile/rest/solr/select?q=' + queryString;
        $http.get(query).success(function (data) {
            if (data !== null && data !== undefined) {
                if (data.response !== null && data.response !== undefined) {
                   if (data.response.numFound !== null && data.response.numFound !== undefined && data.response.numFound !== 0) {
                        $location.path('/search/searchResults');
                    } else {
                       $scope.$broadcast('event:on-case-return');
                    }; 
                } else {
                    $scope.$broadcast('event:on-case-return');
                }
            } else {
                $scope.$broadcast('event:on-case-return');
            };
                
        }).error(function (data) {
            $scope.$broadcast('event:on-case-return');
        });


    }

    function getFacetTemplate(type) {
        if (type === 1) {
            return "facet=true&facet.query=true&facet.field=primary_country&facet.field=primary_state&facet.field=app_status&facet.field=has_primary_attorney&facet.field=has_secondary_attorney&facet.field=has_no_attorney";
        };

        if (type === 2) {
            return "facet=true&facet.query=true&facet.field=app_status&facet.field=has_mark_literal&facet.field=no_mark_literal";
        };

        if (type === 3) {
            return "facet=true&facet.query=true&facet.field=owner_category&facet.field=app_status&facet.field=owner_addr_country&facet.field=owner_addr_state";
        };

    }

    var getSearchType = function() {
        return searchType;
    };

    var getActionType = function() {
        return actionType;
    };

    var getQueryString = function() {
        return queryString;
    };

    var getFacet = function() {
        return facet;
    }

    var getSearchObject = function() {
        return searchObject;
    }

    var setPagination = function(value) {
        pagination = value;
    }

    var getPagination = function() {
        return pagination;
    }

    var setSort = function(value) {
        sort = value
    }

    var getSort = function() {
        return sort;
    }


    var formString = function(arrvalinput) {
        var arrreturn = [];
        var strval = "";
        var breaktext = [];
        if (arrvalinput != undefined && arrvalinput != null) {
            for (var i = 0; i < arrvalinput.length; i++) {
                strval = arrvalinput[i];
                strval = strval.trim();
                if (strval.search(" ") > 0) {
                    strval = '"' + strval + '"'
                    arrreturn.push($.trim(strval));
                } else {
                    arrreturn.push($.trim(arrvalinput[i]));
                }
            }
        }
        return arrreturn;
    }

    

    var getQuery = function(arr) {
        var str = '';
        if (arr != undefined && arr != null) {
            for (var i = 0; i < arr.length; i++) {
                if (str !== '') {
                    str += " AND " + arr[i];
                } else {
                    str = arr[i];
                }
            }
        }
        return str;
    }


    return {
        getQuery: getQuery,
        formString: formString,
        buildAndExecuteSearchQuery: buildAndExecuteSearchQuery,
        getSearchType: getSearchType,
        getActionType: getActionType,
        getQueryString: getQueryString,
        getFacet: getFacet,
        getSearchObject: getSearchObject,
        setPagination: setPagination,
        getPagination: getPagination,
        setSort: setSort,
        getSort: getSort
    }
});



efileApp.service('SignatureRequestEmailSevice', function($location, EmailSignatureRequestResource) {
    // signature request email form 
    var signatureRequestEmail = {
        actionType : "",
        progressLink : "",
        signatureLink : "",
        operatorName : "",
        recipientName : "",
        operatorEmail : "",
        recipientEmail : "",
        confirmOperatorEmail : "",
        confirmRecipientEmail : ""
    }

    // init signature request email form
    signatureRequestEmail.progressLink = $location.absUrl();
    signatureRequestEmail.signatureLink = $location.absUrl();

    // Sevice function
    var sendRequestSignatureEmail = function() {
        var result = validateForm(signatureRequestEmail);
        if (result === true) {
            EmailSignatureRequestResource.save(signatureRequestEmail);
        } else {
            console.log(result);
        };
    }

    var validateForm = function(form) {
        var errors = [];
        var emptyInputRegex = /^\s*$/;
        var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        // your email field
        if (form.operatorEmail === null || form.operatorEmail === undefined || emptyInputRegex.test(form.operatorEmail)) {
            errors.push("Your email is required");
        } else {
            // email validation
            if (!emailRegex.test(form.operatorEmail)) {
                errors.push("Your email address is invalid");
            };
        };

        // your email confirm field
        if (form.confirmOperatorEmail === null || form.confirmOperatorEmail === undefined || emptyInputRegex.test(form.confirmOperatorEmail)) {
            errors.push("You should confirm your email");
        } else {
            // confirm validation
            if (form.confirmOperatorEmail != form.operatorEmail) {
                errors.push("Please confirm your email again");
            };
        };

        // Recipient email
        if (form.recipientEmail !== null && form.recipientEmail !== undefined && !emptyInputRegex.test(form.recipientEmail)) {
            if (!emailRegex.test(form.recipientEmail)) {
                errors.push("Recipient email address is invalid");
            } else {
                if (form.recipientEmail != form.confirmRecipientEmail) {
                    errors.push("Please confirm recipient  email again");
                };
            };
        };

        // return result
        if (errors.length == 0) {return true;} 
        else {return errors;}
    }

    // setter and getter
    var setSignatureRequestEmail = function(requestForm) {
        signatureRequestEmail = requestForm
    }

    var getSignatureRequestEmail = function() {
        return signatureRequestEmail;
    }

    return {
        sendRequestSignatureEmail : sendRequestSignatureEmail,
        setSignatureRequestEmail : setSignatureRequestEmail,
        getSignatureRequestEmail : getSignatureRequestEmail
    }
});
