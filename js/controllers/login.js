app.controller("LoginController", function LoginController($scope, $rootScope, $location, ApiFactory, $http) {
	$scope.domain = $rootScope.oauth.domain;
	$rootScope.login = true;
	
	$rootScope.doLogin = function () {
		// if (localStorage.getItem("authenticated"))
		// 	return;

		if ($scope.domain == localStorage.getItem('domain') && $rootScope.oauth.auth_id) {
			if ($rootScope.oauth.access_token && $rootScope.oauth.access_token.length !== 0) {
				ApiFactory.getEndpoint("stores", {}, true).then(function (data) {
					console.log(data);
					$rootScope.authenticated = true;
					localStorage.setItem("authenticated", $rootScope.oauth.authenticated);
					setStoreInfo(data);
					
					if ($location.search().rdr !== '/login') {
						$location.path($location.search().rdr).search('rdr', null);
					} else {
						$location.path("/").search('rdr', null);
					}
				});
			} else {
				$rootScope.authenticated = true;
				$scope.showLoading = true;

				localStorage.setItem("authenticated", $rootScope.oauth.authenticated);
				
        var sha = new jsSHA('SHA-256', 'TEXT');
        console.log($rootScope.oauth);
        sha.update(($rootScope.oauth.secret + $rootScope.oauth.code + $rootScope.oauth.client_id + $rootScope.oauth.scope + decodeURIComponent($rootScope.oauth.redirect_uri)).toLowerCase());
        $rootScope.oauth.signature = sha.getHash('HEX');

				$http({
					method: 'POST',
					url: 'https://' + $scope.domain + '/api/oauth/access_token',
					data: {
						client_id: $rootScope.oauth.client_id,
						auth_id: $rootScope.oauth.auth_id,
						signature: $rootScope.oauth.signature
					},
					headers: {
						'Content-Type': 'application/json'
					},
					dataType: 'JSON'
				}).then(function (res) {
					console.log(res)
					$rootScope.oauth.access_token = res.data.access_token;
					$rootScope.oauth.refresh_token = res.data.refresh_token;

					ApiFactory.getEndpoint("stores", {}, true).then(function (data) {
						console.log(data);
						setStoreInfo(data);
					});

					localStorage.setItem('access_token', $rootScope.oauth.access_token);
					localStorage.setItem('refresh_token', $rootScope.oauth.refresh_token);
					localStorage.setItem('signature', $rootScope.oauth.signature);

					if ($location.search().rdr !== '/login') {
						$location.path($location.search().rdr).search('rdr', null);
					} else {
						$location.path("/").search('rdr', null);
					}
				});
			}
		} else {
			localStorage.setItem('domain', $scope.domain);
			window.location.href = 'https://' + $scope.domain + $rootScope.oauth.authUrl + '?client_id=' + $rootScope.oauth.app_id + '&scope=' + $rootScope.oauth.scope + '&redirect_uri=' + $rootScope.oauth.redirect_uri;
		}

		localStorage.setItem("authenticated", $rootScope.oauth.authenticated);
	}

	if ($scope.domain == localStorage.getItem('domain') && $rootScope.oauth.auth_id) {
		$rootScope.doLogin();
	}

	function setStoreInfo(data){
		$rootScope.stores = data.stores;

		for(var i in data.stores){
			if (checkDomain(data.stores[i].domain_name, $rootScope.oauth.domain) && !data.stores[i].is_micro_store){
				$rootScope.storeName = data.stores[i].name;
				$rootScope.storeid = data.stores[i].id;
			}
		}
	}
	function checkDomain(storeDomain, currentDomain){
		//normlize domains
		if (storeDomain.indexOf("www") != -1 && currentDomain.indexOf("www") == -1)
			currentDomain = "www." + currentDomain;

		if (storeDomain.indexOf("www") == -1 && currentDomain.indexOf("www") != -1)
			storeDomain = "www." + storeDomain;

		return currentDomain == storeDomain;
	}
});