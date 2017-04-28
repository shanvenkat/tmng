'use strict';

/* Controllers */
/* Controllers for Search Cases */

/* search by serial/registration, mark literal, or docket number */
efileControllers.controller('SerialNumberTabCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'serialNumber','SolrResource', 'SearchSevice',
    function($scope, $rootScope, $routeParams, $location, SerialNumber,SolrResource, SearchSevice) {           
        
        $scope.needOption = false;
        $scope.serialNumberRequired = false;
        $scope.markLiteralRequired = false;
        $scope.docketNumberRequired = false;
        $scope.serialNumberWrong = false;
        $scope.noCaseMsg = false;

        // initalize Error
        if ($routeParams.errMsg) {
            $scope.showErr = true;
            $scope.errMsg = $routeParams.errMsg;
        } else {
            $scope.showErr = false;
        };

        $scope.resourceBundle = $rootScope.rootResourceBundleResource;
        $scope.action = 'raa'; // by default, raa is checked.
        
        //var nameRegex = /^[a-zA-Z0-9\d{7}]+$/;
         
        //var nameRegex = /^[a-zA-Z\s,]+$/;
        //var nameRegex = /^[a-zA-Z0-9\s,]+$/;
       
        var nameRegex = /^(\d{7,8})(,\s?\d{7,8})*$/;

        var onlySpaceRegex = /^\s?$/;

        $scope.clearErrMsg = function () {
            $scope.nameErrNeedSerialNumber = false;
            $scope.nameErrNeedRadioButtonVal = false;
            $scope.nameErrOnlyChar = false;
        }

        

        $scope.go = function(param1, param2) {
             
            //alert (" nameRegex.test(param1) " + nameRegex.test(param1))
            //alert (" onlySpaceRegex.test(param1) " + onlySpaceRegex.test(param1))        

            if (param1 !== undefined && param2 !== undefined && !onlySpaceRegex.test(param1)) {
               //var serialNumbers = $scope.serialNumber.replace(/\s/g, '').split(",");
                
                if (param2 === 'serialnumber' && nameRegex.test(param1)){
                    var serialNumbers = param1.replace(/\s/g, '').split(",");                           
                    var searchObject = {
                    "serial_num" : serialNumbers
                    }; 
                    var searchType = 'SERIAL_NUMBER_SEARCH';
                    SearchSevice.buildAndExecuteSearchQuery(searchObject, searchType, 'SEARCH', $scope);
                } else if (param2 === 'markliteral'){
                    var arrvalinput = $scope.serialNumber.split(",");                                  
                    var adddblquote = SearchSevice.formString(arrvalinput)                                                               
                    var searchObject = {
                    "mark_literal" : adddblquote
                    };                                    
                    var searchType = 'MARK_LITERAL_SEARCH';
                    SearchSevice.buildAndExecuteSearchQuery(searchObject, searchType, 'SEARCH', $scope);                                
                } else if (param2 === 'docketnumber') {
                    var serialNumbers = param1.replace(/\s/g, '').split(",");
                    var searchObject = {
                        "docket_number" : serialNumbers
                        }; 
                    var searchType = 'DOCKET_NUMBER_SEARCH';
                    SearchSevice.buildAndExecuteSearchQuery(searchObject, searchType, 'SEARCH', $scope);                                 
                }     
            }
            
            // validation and error message
            if (param2 === null || param2 === undefined) {
                $scope.needOption = true;
            } else {
                $scope.needOption = false;

                if (onlySpaceRegex.test(param1) || param1 === undefined || param1 === null) {
                    if (param2 === 'serialnumber'){
                        $scope.serialNumberRequired = true;
                    }
                    if (param2 === 'markliteral'){
                        $scope.markLiteralRequired = true;
                    }
                    if (param2 === 'docketnumber') {
                        $scope.docketNumberRequired = true;
                    }
                } else {
                    if (param2 === 'serialnumber' && !nameRegex.test(param1)){
                        $scope.serialNumberWrong = true; 
                    } else {
                        $scope.serialNumberWrong = false; 
                    }
                };
            };

            

            /*if (param1 === null || param1 === undefined || onlySpaceRegex.test(param1)) {
                    $scope.nameErrNeedSerialNumber = true;                    
            } else {               
                    $scope.nameErrNeedSerialNumber = false;                
            };
         

            if (!nameRegex.test(param1) && param1 !== null) {
                        $scope.nameErrOnlyChar = true;                
                } else {
                        $scope.nameErrOnlyChar = false;
                };


            if (param2 === null || param2 === undefined) {
                                $scope.nameErrNeedRadioButtonVal = true;
                        } else {
                                $scope.nameErrNeedRadioButtonVal = false;
                };
                */


            /*if (pn.utils.isBlank($scope.serialNumber) || ($scope.buttonval == undefined)) {          
                //$scope.message = 'Serial Number is required!';
                //$scope.showme = true;                 
                alert ("Value in Search Box and Search by option both required.!")
            }           
            else 
            {
                //var serialNumbers = $scope.serialNumber.replace(/\s/g, '').split(",");
              // //RAA               
              // if (serialNumbers.length === 1 && $scope.buttonval == 'serialnumber' ) {
              //         //RAA)
              //         if ("raa" === $scope.action) {
              //             $location.path('/raa/' + $scope.serialNumber);
              //         }

              //         if ("raa2" === $scope.action) {
              //             $location.path('/removeAttorney/' + $scope.serialNumber);
              //         }
                      
              //         if ("raa3" === $scope.action) {
              //             $location.path('/attorney/withdraw/case/' + $scope.serialNumber);
              //         }
              // } 
              // else              
            }*/
        };


        $scope.clearError = function() {
            $scope.needOption = false;
            $scope.serialNumberRequired = false;
            $scope.markLiteralRequired = false;
            $scope.docketNumberRequired = false;
            $scope.serialNumberWrong = false;
            $scope.noCaseMsg = false;
        }

        $scope.$on('event:on-case-return', function() {
            $scope.noCaseMsg = true;
        });
    }
]);

/* search by attorney or law firm */
efileControllers.controller('OwnerTabCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'serialNumber', 'SolrResource', 'SearchSevice',
    function($scope, $rootScope, $routeParams, $location, SerialNumber, SolrResource, SearchSevice) {
        $scope.owner = {};
        $scope.nameErrNeedName = false;
        $scope.noCaseMsg = false;
        $scope.nameErrOnlyChar = false;
        $scope.owner.foreignSelection = false;
        $scope.owner.domesticSelection = false;

        var arr = [];
        var searchObject = {};
        var nameRegex = /^[\S\s,]+$/;
        var onlySpaceRegex = /^\s?$/;

        $scope.selectForeignEntityType = function() {
            if (!$scope.owner.srcByForeignEntity) {
                $scope.owner.foreignSelection = false;
                $scope.owner.domesticSelection = false;
            } else {
                $scope.owner.foreignSelection = false;
                $scope.owner.domesticSelection = true;
            }
        }

        $scope.selectDomesticEntityType = function() {
            if (!$scope.owner.srcByDomEntity ) {
                $scope.owner.foreignSelection = false;
                $scope.owner.domesticSelection = false;
            } else {
                $scope.owner.foreignSelection = true;
                $scope.owner.domesticSelection = false;

            }
        }



        $scope.$watch('owner.srcByCountry', function(val) {
            if (val !== 'US') {
                $scope.owner.srcByState = '';
            }
        });

        $scope.goToSearchResultByOwner = function() {

            if ($scope.owner.srcByNm !== null &&
                $scope.owner.srcByNm !== undefined &&
                nameRegex.test($scope.owner.srcByNm) &&
                !onlySpaceRegex.test($scope.owner.srcByNm)) {

                searchObject = {
                    "owner_nm": $scope.owner.srcByNm,
                    "owner_street_addr": $scope.owner.srcByAddr,
                    "country_of_owner": $scope.owner.srcByCountry,
                    "state_of_owner": $scope.owner.srcByState,
                    "owner_domestic_entity_type": $scope.owner.srcByDomEntity,
                    "owner_foreign_entity_type": $scope.owner.srcByForeignEntity
                };

                SearchSevice.buildAndExecuteSearchQuery(searchObject, "OWNER_SEARCH", 'SEARCH', $scope);

            }

            if ($scope.owner.srcByNm === null ||
                $scope.owner.srcByNm === undefined ||
                onlySpaceRegex.test($scope.owner.srcByNm)) {
                $scope.nameErrNeedName = true;
            } else {
                $scope.nameErrNeedName = false;
            };

            if (!nameRegex.test($scope.owner.srcByNm) &&
                $scope.owner.srcByNm !== null &&
                !onlySpaceRegex.test($scope.owner.srcByNm)) {
                $scope.nameErrOnlyChar = true;
            } else {
                $scope.nameErrOnlyChar = false;
            };
        }

        $scope.clearErrMsg = function() {
            $scope.nameErrNeedName = false;
            $scope.nameErrOnlyChar = false;
            $scope.noCaseMsg = false;
        }

        
        $scope.$on('event:on-case-return', function() {
            $scope.noCaseMsg = true;
        });
    }
]);

/* search by owner or applicant */
efileControllers.controller('LawFirmTabCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'serialNumber', 'SolrResource', 'SearchSevice',
    function($scope, $rootScope, $routeParams, $location, SerialNumber, SolrResource, SearchSevice) {         
        
        var searchObject = {};
        var arrvalinput1 = [];
        var adddblquote1 = [];

         
        var nameRegex = /^[a-zA-Z]/;
        var onlySpaceRegex = /^\s?$/;

        $scope.clearErrMsg = function () {
            $scope.nameErrNeedLawFirmName = false;
            $scope.nameErrOnlyChar = false;
            $scope.noCaseMsg = false;
        }
        
        $scope.goToSearchResultByLawFirm = function(param1, param2, param3, param4, param5) {                
            if (param1 != undefined  && nameRegex.test(param1)) {            
                    arrvalinput1 = param1.split(","); 
                     adddblquote1 = SearchSevice.formString(arrvalinput1)
                     var replacedblQuotewithSpaces1 = adddblquote1.toString().replace(/,/g, ' ');
                     searchObject.LawFirm_Name =  adddblquote1.toString().replace(/,/g, ' '); 
                        
                        if (param2 != undefined)                 
                        {                        
                            searchObject.LawFirm_State = param2                 
                        }
                        if (param3 != undefined)                 
                        {
                             var arrvalinput3 = param3.split(",");
                             var adddblquote3 = SearchSevice.formString(arrvalinput3)                            
                            searchObject.LawFirm_EmailAddress = adddblquote3.toString().replace(/,/g, ' ');             
                        }

                        if (param4 != undefined)                 
                        {
                            var arrvalinput4 = param4.split(",");
                            var adddblquote4 = SearchSevice.formString(arrvalinput4); 
                            var replacedblQuotewithSpaces4 = adddblquote4.toString().replace(/,/g, ' ');
                            var finalStr4 = escape(replacedblQuotewithSpaces4);                                                      
                            searchObject.LawFirm_MarkOwner = finalStr4;              

                        }

                        if (param5 != undefined)                 
                        {                            
                            var arrvalinput5 = param5.split(",");
                            var adddblquote5 = SearchSevice.formString(arrvalinput5);                         
                            var replacedblQuotewithSpaces5 = adddblquote5.toString().replace(/,/g, ' ');
                            var finalStr5 = escape(replacedblQuotewithSpaces5);                             
                            searchObject.LawFirm_ExactFirmName = finalStr5;              
                        }

                         SearchSevice.buildAndExecuteSearchQuery(searchObject, "LAWFIRM_SEARCH", 'SEARCH', $scope);                 
            }


            if (param1 === null || param1 === undefined || onlySpaceRegex.test(param1)) {
                $scope.nameErrNeedLawFirmName = true;
            } else {
                $scope.nameErrNeedLawFirmName = false;
            };

            
            if ( param1 !== undefined && !nameRegex.test(param1)) {
                $scope.nameErrOnlyChar = true;                
            } else {
                $scope.nameErrOnlyChar = false; 
            };

           

        }

        $scope.noCaseMsg = false;
        $scope.$on('event:on-case-return', function() {
            $scope.noCaseMsg = true;
        });        
    }
]);

/* search result */
efileControllers.controller('SearchResultsCtrl', ['$http','$scope', '$rootScope', '$routeParams', '$location', 'SearchResource', 'attorneySearchResultList', 'SearchSevice',
    function($http, $scope, $rootScope, $routeParams, $location, SearchResource, AttorneySearchResultList, SearchSevice) {

        $scope.pageSize = 100;
        $scope.caseList = [];
        $scope.itemPerPages = [1, 2, 3, 10, 25, 50, 100];
        $scope.selectedItems = 0;
        $scope.checkedItems = [];
        $scope.dict = {
            'currentPage': 1
        }; 
        $scope.selectedStates='';
        $scope.sortCol = 'primary_attorney_full_nm';
        $scope.sortOrder = 'asc';
        $scope.itemToDisplay=1;

        $scope.expandCollapseValue = 0; 
        $scope.activePosition = -1;

        //mark image url
        $scope.cmsMarkUrl = "";
        $http.get("/efile/rest/cms/mark/url")
        .success(function (url) {     
             ////console.log('url: '+url);                             
             $scope.cmsMarkUrl = url;  
        }) 
        .error(function (error) { 
            ////console.log('Error: ' + error);
        });

        //-----------------------------------------------------------------------------------------------
        $scope.q = "";
        $scope.facet = "";
        $scope.searchObject = {};
        $scope.searchType = "";
        $scope.wrapSerialNumber = "";
        $scope.fqTxtSearch = "";

        // init page
        $scope.q = SearchSevice.getQueryString();
        $scope.actionType = "";
        $scope.facet = SearchSevice.getFacet();
        $scope.searchObject = SearchSevice.getSearchObject();
        $scope.searchType = SearchSevice.getSearchType();
        executeQuery("");
        $scope.wrapSerialNumber = searchByShow($scope.searchObject.serial_num, $scope.searchType);
        $scope.actionType = SearchSevice.getActionType();

        // UI function
        // for search within search
        $scope.goFilterSearch = function(txtString) {
            var searchCriteria = "";

            if (txtString !== null && txtString !== undefined && /\S/.test(txtString)) {
                var searchCriteria = "collector:(\"" + txtString.replace(/,/g, "\"+OR+\"") + "\")";
            };

            $scope.fqTxtSearch = searchCriteria;
            $scope.doFilterSearch();
        }

        // for facet search
        $scope.doFilterSearch = function (){
            var fq = "";
            var filterSearchObject = {
                "attorneyRole" : [],
                "attorneyAddress" : [],
                "primaryCountry" : [],
                "markStatus" : [],
                "attorneyState" : [],
                "ownerState" : [],
                "ownerAddrCountry" : [], 
                "ownerCategory" : [],
                "markLiteral" : []
            }

            $('input:checkbox[name^="facet_field"]:checked').map(function(){
                var facetName = this.name.replace("facet_field_", '');
                var facetValue = this.value;

                if (facetName === "has_primary_attorney" || facetName === "has_secondary_attorney" || facetName === "has_no_attorney") {
                    filterSearchObject.attorneyRole.push(facetName);
                };

                if (facetName === "primary_country") {
                    filterSearchObject.primaryCountry.push(facetValue);
                };

                if (facetName === "owner_addr_country") {
                    filterSearchObject.ownerAddrCountry.push(facetValue);
                };

                if (facetName === "app_status") {
                    filterSearchObject.markStatus.push(facetValue);
                };

                if (facetName === "owner_category") {
                    filterSearchObject.ownerCategory.push(facetValue);
                };

                if (facetName === "has_mark_literal" || facetName === "no_mark_literal") {
                    filterSearchObject.markLiteral.push(facetName);
                };

            });

            $('select[name="facet_field_primary_state"] option:selected').map(function () {
                if (this.value !== "") {
                    filterSearchObject.attorneyState.push(this.value);
                }; 
            });

            $('select[name="facet_field_owner_addr_state"] option:selected').map(function () {
                if (this.value !== "") {
                    filterSearchObject.ownerState.push(this.value);
                }; 
            });
            
            fq = buildFilterQuery(filterSearchObject);
            executeQuery(fq);
        }

        $scope.clearExpandCollapse = function(){
           $scope.activePosition = -1;
        }

        $scope.formatDate = function (inpdate){
            return new Date(inpdate);            
        }

        $scope.getCount = function(result, key) {
            if(result !== undefined && result !== null) {
                     for(var i=0; i < result.length; i+=2) {
                        if(result[i] === key) {
                             return result[i+1];
                        }
                     }
            }
            return 0;
        }

        $scope.getName = function(secAtt) {
            return getAttField(secAtt,1);
       };   

         $scope.getFirmName = function(secAtt) {
            return getAttField(secAtt,2);
        };        

        $scope.getDocketNumber = function(secAtt) {
            return getAttField(secAtt,3);
        };
       
        $scope.getAddress = function(secAtt) {
            var arr = new Array();
            arr.push($.trim(getAttField(secAtt,4)));
            arr.push($.trim(getAttField(secAtt,5)));
            arr.push($.trim(getAttField(secAtt,6)));
            arr.push($.trim(getAttField(secAtt,7)));
            arr.push($.trim(getAttField(secAtt,8)));
            arr.push($.trim(getAttField(secAtt,9)));
            var tmp= $.grep(arr,Boolean).join(',');
            return tmp;
        };

        $scope.getEmail = function(secAtt) {
           return getAttField(secAtt,10);
        };

        $scope.toggleClass = function($index) {
            $scope.activePosition = $scope.activePosition == $index ? -1 : $index;
        };

        $scope.pageChanged = function() {
            $scope.doFilterSearch();
            $scope.selectedItems = 0;//AS adding it.
        };

        $scope.changePageSize = function(itemPerPage) {            
            $scope.pageSize = itemPerPage;
            $scope.pageChanged();
        }

        $scope.submitGotoItem = function() {
            var pageToDisplay = Math.ceil(parseInt($scope.itemToDisplay) / $scope.pageSize);
            $scope.dict.currentPage = pageToDisplay;
            $scope.pageChanged();
        }

        $scope.goToPage = function() {
            $scope.itemToDisplay = $('#jumpToItem2').val();
            $('input:submit[name=submitGotoItem]').trigger('click');
        }        

        $scope.clear = function() {
            clearFacetChoice ();

            $scope.fqTxtSearch = "";
            
            $scope.doFilterSearch();
        }

        $scope.searchAgain = function() {
            clearFacetChoice ();

            $scope.q = "";
            $scope.facet = "";
            $scope.searchObject = {};
            $scope.searchType = "";
            $scope.wrapSerialNumber = "";
            $scope.fqTxtSearch = "";
            $location.path('/attorney');
        }

        $scope.changeSorting=function(colName) {
            if(colName === $scope.sortCol) {
                $scope.sortOrder = $scope.sortOrder==='asc'?'desc':'asc';
            }
            $scope.sortCol = colName;
            $scope.doFilterSearch();
        }
        
        $scope.goToAppoint = function() {
            var checkedItems = [];
            var checkedSerialNumbers = [];
            angular.forEach($scope.solrResults.response.docs, function(result) {
                if (result.cb) {                     
                    var attorneys = [];// store all attorneys here.
                    
                    var nameArray = [];
                    if(result.primary_attorney_first_nm){
                        nameArray.push(result.primary_attorney_first_nm);
                    }
                    
                    if(result.primary_attorney_middle_nm){
                        nameArray.push(result.primary_attorney_middle_nm);
                    }
                    
                    if(result.primary_attorney_last_nm){
                        nameArray.push(result.primary_attorney_last_nm);
                    }
                    
                    if(result.primary_attorney_suffix_nm){
                        nameArray.push(result.primary_attorney_suffix_nm);
                    }
                    
                    var primaryAttorneyName = nameArray.join(" ");
                    
                    var addressArray = [];
                    if(result.primary_street_addr_line1){
                        addressArray.push(result.primary_street_addr_line1);
                    }
                    
                    if(result.primary_street_addr_line2){
                        addressArray.push(result.primary_street_addr_line2);
                    }
                    
                    if(result.primary_street_addr_line3){
                        addressArray.push(result.primary_street_addr_line3);
                    }
                    
                    if(result.primary_city){
                        addressArray.push(result.primary_city);
                    }
                    

                    var primaryAttorneyAddress = addressArray.join(" ");
                    
                    var primaryAttorney = {
                          roleCd: "AT",
                          partyName: primaryAttorneyName,
                          firmName: result.firm_name,
                          address: primaryAttorneyAddress,
                          geographicRegion: result.primary_state,
                          country: result.primary_country,
                          docketNumber: result.docket_number,
                          email:result.primary_email
                    };
                    attorneys.push(primaryAttorney);
                    
                    angular.forEach(result.secondary_attorney, function(secAtt) {
                      var secondaryAttorney = {
                          roleCd: "SAT",
                          partyName: $scope.getName(secAtt),
                          firmName: "firmName",
                          address: $scope.getAddress(secAtt),
                          geographicRegion: "geographicRegion",
                          country: "country",
                          docketNumber: $scope.getDocketNumber(secAtt),
                          email:$scope.getEmail(secAtt)
                      };
                      attorneys.push(secondaryAttorney);
                    });
                    
                    var tmCase = {
                      id:result.trademark_id, 
                      serialNumTx:result.serial_num,
                      primaryAttorneyName: primaryAttorneyName,
                      primaryAttorneyFirm:result.firm_name,
                      literalElementTx:result.literalElementTx,
                      standardCharacterTx:result.standardCharacterTx,
                      owner: result.owner_nm,
                      attorneys:attorneys
                    };
                    checkedItems.push(tmCase);

                    checkedSerialNumbers.push(result.serial_num);
                }
            });
            
            AttorneySearchResultList.setAttorneySearchResultList(checkedItems);
            if (checkedItems.length > 0) {
                $scope.showErr = false;
                $location.path('/attorneys/add');
            } else {
                $scope.showErr = true;
            }

            // pulling case from trm
            var pullingDate = $http({
                method: 'POST',
                url: '/efile/rest/raa/getCases',
                data: checkedSerialNumbers
            }).success(function() {
                //console.log("success");
            });
        }

        $scope.allNeedsClicked = function() {
            var newValue = !$scope.allNeedsMet();
            angular.forEach($scope.solrResults.response.docs, function(result) {
                result.cb = newValue;
            });
            $scope.calculateSelectedItems();
        };

        $scope.calculateSelectedItems = function() {
            var checkedItems = [];
            angular.forEach($scope.solrResults.response.docs, function(result) {
                if (result.cb) {
                    checkedItems.push(result);
                }
            })
            $scope.selectedItems = checkedItems.length;
        }

        // Returns true if and only if all todos are done.
        $scope.allNeedsMet = function() {
            var needsMet = 0;
            // user landed and hasn't searched for anything.
            if($scope.solrResults!=null){
              if($scope.solrResults.response){
                angular.forEach($scope.solrResults.response.docs, function(result) {
                    needsMet = needsMet + (result.cb ? 1 : 0)
                });
              }
              if (needsMet == 0) {
                  return false;
              } else {
                  return (needsMet === ($scope.solrResults ? $scope.solrResults.response.docs.length : 0));
              }
            } else {
              return true;
            }
        };


        // Tools
        // execute query
        function executeQuery (fq) {
            // base query string
            var query ='/efile/rest/solr/select?q=' + $scope.q + '&' + $scope.facet;
                       
            // filter query
            var fqs = [];
            // facet search
            if(fq !== null && fq !== undefined && /\S/.test(fq)) {
                fqs.push(fq);
            }
            // search within search
            if ($scope.fqTxtSearch != "") {
                fqs.push($scope.fqTxtSearch);
            };

            // combine
            if (fqs.length != 0) {
                query += '&fq=' + fqs.join("+AND+");
            };
            

            // for pagination and sort
            var start = ($scope.dict.currentPage-1)*$scope.pageSize;
            var numberOfRecords =  $scope.pageSize;         

            var pagination = '&start='+start+'&rows='+numberOfRecords;
            var sort = '&sort='+$scope.sortCol+'+'+$scope.sortOrder;
        
            query += pagination + sort;

            console.log(query);
            // call solr restful
            $http.get(query).success(function (data) {          
                $scope.solrResults = data;
           }).error(function (data) { 
                //console.log('Error: ' + data);
            });

        }

        // bulid filter query base on filter search object
        function buildFilterQuery(filterSearchObject) {
            var fqArray = [];

            // build sub filter query
            $.each(filterSearchObject, function(key, value) {
                // for Attorney Role
                if (key === "attorneyRole" && value.length != 0) {
                    $.each(value, function(idx, element) {
                        value[idx] = element + ":(Y)";
                    });
                    var filterATRole = "(" + value.join("+OR+") + ")";
                    fqArray.push(filterATRole);
                };
                // for mark literal
                if (key === "markLiteral" && value.length != 0) {
                    $.each(value, function(idx, element) {
                        value[idx] = element + ":(YES)";
                    });
                    var filterMarkLiteral = "(" + value.join("+OR+") + ")";
                    fqArray.push(filterMarkLiteral);
                };
                // for Attorney Address
                if (key === "primaryCountry" && value.length != 0) {
                    var filterATAddress = "primary_country:(" + value.join("+") + ")";
                    fqArray.push(filterATAddress);
                };
                // for owner category Address
                if (key === "ownerCategory" && value.length != 0) {
                    var filterATAddress = "owner_category:(" + value.join("+") + ")";
                    fqArray.push(filterATAddress);
                };
                // for owner Address
                if (key === "ownerAddrCountry" && value.length != 0) {
                    var filterATAddress = "owner_addr_country:(" + value.join("+") + ")";
                    fqArray.push(filterATAddress);
                };
                // for attorney U.S. Attorney State
                if (key === "attorneyState" && value.length != 0) {
                    var filterATState = "primary_state:(" + value.join("+") + ")";
                    fqArray.push(filterATState);
                };
                // for owner U.S. Attorney State
                if (key === "ownerState" && value.length != 0) {
                    var filterATState = "owner_addr_state:(" + value.join("+") + ")";
                    fqArray.push(filterATState);
                };
                // for Mark Status
                if (key === "markStatus" && value.length != 0) {
                    var filterMarkStatus = "app_status:(" + value.join("+") + ")";
                    fqArray.push(filterMarkStatus);
                };
            });
            
            return fqArray.join("+AND+");
        }

        // to show search criteria
        function searchByShow(array, type) {
            if(type === 'SERIAL_NUMBER_SEARCH') {
                var result = [];
                var i, j, count;
                count = 5;

                for (i = 0, j = array.length; i < j; i += count) {
                    result.push(array.slice(i, i + count).join(", "));
                }

                return result;
            };

            return "";
        }

        // split string by |
        function getAttField(att, index) {
            if(att != undefined && att != null && att.length >= index+1) {;
                return att.split('|')[index];
            }
            return '';
        }

        function clearFacetChoice () {
            $('select[name="facet_field_primary_state"] option:selected').removeAttr("selected");
            $('select[name="facet_field_owner_addr_state"] option:selected').removeAttr("selected");
            $('input:checkbox[name^="facet_field"]').removeAttr('checked');
            $('input:text[name^="facet_field"]').val("");
        }

        //-----------------------------------------------------------------------------------------------

        var table = $('#searchResultTable');   

        $('.default').on('click', function() {
            pn.table.sort(table, {
                targetSelector: table.find('tr').first()
            })
        })

        $('.custom').on('click', function() {
            pn.table.sort(table, {
                targetSelector: table.find('th')[1],
                comparator: function(a, b) {
                    return a.text().length - b.text().length
                }
            })
        })

    }
]);
